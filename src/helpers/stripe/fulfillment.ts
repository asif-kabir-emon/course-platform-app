import { Prisma } from "@prisma/client";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/utils/sendEmail";

function formatMoney(amountInCent: number, currency = "usd") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountInCent / 100);
}

export const processStripeCheckout = async (
  checkoutSession: Stripe.Checkout.Session,
) => {
  const productId = checkoutSession.metadata?.productId;
  const userId = checkoutSession.metadata?.userId;
  const promotionId = checkoutSession.metadata?.promotionId;
  const metadataDiscountInCent = Number(
    checkoutSession.metadata?.promotionDiscountInCent ?? 0,
  );

  if (!["paid", "no_payment_required"].includes(checkoutSession.payment_status)) {
    throw new Error("Checkout session is not paid.");
  }

  if (productId == null || userId == null) {
    throw new Error("Missing metadata.");
  }

  const [existingPurchase, product, user, business] = await Promise.all([
    prisma.purchaseHistories.findUnique({
      where: {
        stripeSessionId: checkoutSession.id,
      },
    }),
    prisma.products.findUnique({
      where: {
        id: productId,
      },
      include: {
        courseProducts: true,
      },
    }),
    prisma.users.findUnique({
      where: {
        id: userId,
      },
    }),
    prisma.businessSettings.findUnique({ where: { key: "default" } }),
  ]);

  if (!product) {
    throw new Error("Product not found.");
  }

  if (!user) {
    throw new Error("User not found.");
  }

  const courseIds = product.courseProducts.map(
    (courseProduct) => courseProduct.courseId,
  );

  const existingCourseAccess = await prisma.userCourseAccess.findMany({
    where: {
      userId,
      courseId: {
        in: courseIds,
      },
    },
    select: {
      courseId: true,
    },
  });

  const existingCourseAccessIds = new Set(
    existingCourseAccess.map((access) => access.courseId),
  );
  const missingCourseIds = courseIds.filter(
    (courseId) => !existingCourseAccessIds.has(courseId),
  );
  let createdPurchaseId: string | undefined;

  try {
    await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      if (!existingPurchase) {
        const createdPurchase = await transaction.purchaseHistories.create({
          data: {
            userId,
            productId,
            stripeSessionId: checkoutSession.id,
            pricePaidInCent:
              checkoutSession.amount_total ??
              Math.round(product.priceInDollar * 100),
            subtotalInCent: checkoutSession.amount_subtotal,
            discountInCent:
              checkoutSession.total_details?.amount_discount ??
              metadataDiscountInCent,
            taxInCent: checkoutSession.total_details?.amount_tax ?? 0,
            currency: checkoutSession.currency ?? "usd",
            invoiceNumber: `${business?.invoicePrefix ?? "INV"}-${checkoutSession.created}-${checkoutSession.id.slice(-6).toUpperCase()}`,
            productDetails: {
              name: product.name,
              description: product.description,
              imageUrls: product.imageUrl,
            },
          },
          select: { id: true },
        });
        createdPurchaseId = createdPurchase.id;
        if (promotionId) {
          await transaction.promotionRedemptions.create({
            data: {
              promotionId,
              userId,
              stripeSessionId: checkoutSession.id,
            },
          });
          await transaction.promotions.update({
            where: { id: promotionId },
            data: { redemptionCount: { increment: 1 } },
          });
        }
      }

      if (missingCourseIds.length > 0) {
        await transaction.userCourseAccess.createMany({
          data: missingCourseIds.map((courseId) => ({
            userId,
            courseId,
          })),
        });
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        productId,
        userId,
        repairedAccessCount: missingCourseIds.length,
      };
    }

    throw error;
  }

  if (createdPurchaseId) {
    const promotionCodeIds = promotionId
      ? []
      : (checkoutSession.total_details?.breakdown?.discounts
          .map(({ discount }) => discount.promotion_code)
          .filter((code): code is string => typeof code === "string") ?? []);
    if (promotionCodeIds.length > 0) {
      await prisma.promotions.updateMany({
        where: { stripePromotionCodeId: { in: promotionCodeIds } },
        data: { redemptionCount: { increment: 1 } },
      });
    }
    const invoiceNumber = `${business?.invoicePrefix ?? "INV"}-${checkoutSession.created}-${checkoutSession.id.slice(-6).toUpperCase()}`;
    const subtotalInCent =
      checkoutSession.amount_subtotal ??
      Math.round(product.priceInDollar * 100);
    const discountInCent =
      checkoutSession.total_details?.amount_discount ?? metadataDiscountInCent;
    const totalInCent =
      checkoutSession.amount_total ??
      Math.max(0, subtotalInCent - discountInCent);
    const promotionLabel =
      checkoutSession.metadata?.promotionLabel ?? "Promotion discount";
    const sellerAddress = [
      business?.addressLine1,
      business?.city,
      business?.country,
    ]
      .filter(Boolean)
      .join(", ");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
    const purchaseUrl = `${appUrl}/purchases/${createdPurchaseId}`;

    await sendEmail({
      email: user.email,
      template: "purchase_confirmation",
      subject: `Your receipt for ${product.name}`,
      emailTexInPlain: [
        `Payment received for ${product.name}.`,
        `Invoice: ${invoiceNumber}`,
        `Date: ${new Date(checkoutSession.created * 1000).toLocaleString()}`,
        `Customer: ${user.email}`,
        `Seller: ${business?.legalName || process.env.NEXT_PUBLIC_APP_NAME || "KnowVeria"}`,
        sellerAddress ? `Address: ${sellerAddress}` : "",
        `Subtotal: ${formatMoney(subtotalInCent, checkoutSession.currency ?? "usd")}`,
        discountInCent > 0
          ? `${promotionLabel}: -${formatMoney(discountInCent, checkoutSession.currency ?? "usd")}`
          : "",
        `Total: ${formatMoney(totalInCent, checkoutSession.currency ?? "usd")}`,
        `View your invoice and receipt: ${purchaseUrl}`,
      ]
        .filter(Boolean)
        .join("\n"),
      emailTextInHTML: `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f7fb; margin:0; padding:0; width:100%;">
          <tr>
            <td align="center" style="padding:24px 12px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:720px; background:#ffffff; border:1px solid #e5e7eb; border-radius:20px;">
                <tr>
                  <td style="padding:28px 32px; background:#eef2ff; border-bottom:1px solid #e5e7eb;">
                    <span style="display:inline-block; font-family:Arial,sans-serif; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#4f46e5; background:#ffffff; border:1px solid #c7d2fe; border-radius:999px; padding:6px 10px;">Payment received</span>
                    <div style="font-family:Arial,sans-serif; font-size:30px; line-height:38px; font-weight:700; color:#111827; padding-top:16px;">Your invoice and receipt</div>
                    <div style="font-family:Arial,sans-serif; font-size:15px; line-height:24px; color:#6b7280; padding-top:8px;">
                      Thank you for purchasing <strong style="color:#111827;">${product.name}</strong>. Your payment was successful and the invoice details are below.
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 32px 16px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td valign="top" width="50%" style="padding:0 12px 16px 0; font-family:Arial,sans-serif;">
                          <div style="font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#9ca3af; padding-bottom:6px;">Invoice</div>
                          <div style="font-size:18px; line-height:26px; font-weight:700; color:#111827;">${invoiceNumber}</div>
                        </td>
                        <td valign="top" width="50%" style="padding:0 0 16px 12px; font-family:Arial,sans-serif;">
                          <div style="font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#9ca3af; padding-bottom:6px;">Date</div>
                          <div style="font-size:16px; line-height:24px; font-weight:600; color:#111827;">${new Date(checkoutSession.created * 1000).toLocaleString()}</div>
                        </td>
                      </tr>
                      <tr>
                        <td valign="top" width="50%" style="padding:0 12px 0 0; font-family:Arial,sans-serif;">
                          <div style="font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#9ca3af; padding-bottom:6px;">Customer</div>
                          <div style="font-size:16px; line-height:24px; font-weight:600; color:#111827;">${user.email}</div>
                        </td>
                        <td valign="top" width="50%" style="padding:0 0 0 12px; font-family:Arial,sans-serif;">
                          <div style="font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#9ca3af; padding-bottom:6px;">Seller</div>
                          <div style="font-size:16px; line-height:24px; font-weight:600; color:#111827;">${business?.legalName || process.env.NEXT_PUBLIC_APP_NAME || "KnowVeria"}</div>
                          ${sellerAddress ? `<div style="font-size:14px; line-height:22px; color:#6b7280; padding-top:4px;">${sellerAddress}</div>` : ""}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 32px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e5e7eb; border-radius:18px; overflow:hidden;">
                      <tr>
                        <td style="padding:16px 18px; border-bottom:1px solid #e5e7eb; background:#f9fafb; font-family:Arial,sans-serif; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#6b7280;">Description</td>
                        <td style="padding:16px 18px; border-bottom:1px solid #e5e7eb; background:#f9fafb; font-family:Arial,sans-serif; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#6b7280;">Reference</td>
                        <td align="right" style="padding:16px 18px; border-bottom:1px solid #e5e7eb; background:#f9fafb; font-family:Arial,sans-serif; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#6b7280;">Amount</td>
                      </tr>
                      <tr>
                        <td valign="top" style="padding:18px; border-bottom:1px solid #e5e7eb; font-family:Arial,sans-serif;">
                          <div style="font-size:16px; line-height:24px; font-weight:700; color:#111827;">${product.name}</div>
                          <div style="font-size:14px; line-height:22px; color:#6b7280; padding-top:4px;">Digital purchase</div>
                        </td>
                        <td valign="top" style="padding:18px; border-bottom:1px solid #e5e7eb; font-family:Arial,sans-serif; font-size:14px; line-height:22px; color:#6b7280;">${createdPurchaseId}</td>
                        <td valign="top" align="right" style="padding:18px; border-bottom:1px solid #e5e7eb; font-family:Arial,sans-serif; font-size:16px; line-height:24px; font-weight:700; color:#111827;">${formatMoney(subtotalInCent, checkoutSession.currency ?? "usd")}</td>
                      </tr>
                      ${
                        discountInCent > 0
                          ? `<tr>
                              <td valign="top" style="padding:18px; border-bottom:1px solid #e5e7eb; font-family:Arial,sans-serif;">
                                <div style="font-size:16px; line-height:24px; font-weight:700; color:#111827;">${promotionLabel}</div>
                                <div style="font-size:14px; line-height:22px; color:#6b7280; padding-top:4px;">Applied promotion</div>
                              </td>
                              <td valign="top" style="padding:18px; border-bottom:1px solid #e5e7eb; font-family:Arial,sans-serif; font-size:14px; line-height:22px; color:#6b7280;">${checkoutSession.metadata?.promotionCode ?? "-"}</td>
                              <td valign="top" align="right" style="padding:18px; border-bottom:1px solid #e5e7eb; font-family:Arial,sans-serif; font-size:16px; line-height:24px; font-weight:700; color:#dc2626;">-${formatMoney(discountInCent, checkoutSession.currency ?? "usd")}</td>
                            </tr>`
                          : ""
                      }
                      <tr>
                        <td colspan="2" style="padding:20px 18px; background:#fcfcff; font-family:Arial,sans-serif;">
                          <div style="font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#9ca3af;">Total paid</div>
                          <div style="font-size:14px; line-height:22px; color:#6b7280; padding-top:4px;">Status: Paid</div>
                        </td>
                        <td align="right" style="padding:20px 18px; background:#fcfcff; font-family:Arial,sans-serif; font-size:28px; line-height:34px; font-weight:800; color:#111827;">${formatMoney(totalInCent, checkoutSession.currency ?? "usd")}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:24px 32px 32px;">
                    <a href="${purchaseUrl}" style="display:inline-block; font-family:Arial,sans-serif; background:#4f46e5; color:#ffffff; text-decoration:none; font-weight:700; padding:14px 22px; border-radius:12px;">View full invoice online</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `,
    });
  }

  return {
    productId,
    userId,
    repairedAccessCount: missingCourseIds.length,
  };
};
