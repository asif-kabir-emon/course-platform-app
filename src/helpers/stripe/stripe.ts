"use server";

import { assertStripeSecretKey, stripeServerClient } from "./stripeServer";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { authKey } from "@/constants/AuthKey.constant";
import { decodedToken } from "@/utils/validateToken";
import { getJwtSecret } from "@/utils/serverEnv";
import { syncPromotionStatuses } from "@/lib/promotions";
import Stripe from "stripe";

async function getEligiblePromotion(code: string, userId: string) {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) return null;
  const promotion = await prisma.promotions.findUnique({
    where: { code: normalizedCode },
  });
  const now = new Date();
  if (
    !promotion ||
    promotion.status !== "active" ||
    !promotion.isActive ||
    !promotion.stripePromotionCodeId ||
    (promotion.startsAt && promotion.startsAt > now) ||
    (promotion.endsAt && promotion.endsAt <= now) ||
    (promotion.maxRedemptions != null &&
      promotion.redemptionCount >= promotion.maxRedemptions)
  ) {
    throw new Error("This promotion code is invalid, inactive, or has ended.");
  }
  if (promotion.maxRedemptionsPerCustomer != null) {
    const customerUses = await prisma.promotionRedemptions.count({
      where: { promotionId: promotion.id, userId },
    });
    if (customerUses >= promotion.maxRedemptionsPerCustomer) {
      throw new Error("You have already used this promotion the maximum number of times.");
    }
  }
  if (promotion.firstTimeCustomersOnly) {
    const paidPurchaseCount = await prisma.purchaseHistories.count({
      where: { userId, refundAt: null, isRefunded: false },
    });
    if (paidPurchaseCount > 0) {
      throw new Error("This promotion is only available for first-time customers.");
    }
  }
  return promotion;
}

function getPromotionLabel(
  promotion: {
    discountType: "percent" | "fixed";
    discountValue: number;
    maximumRedeemAmountInCent?: number | null;
  },
) {
  if (promotion.discountType === "percent") {
    const base = `${promotion.discountValue}% off`;
    return promotion.maximumRedeemAmountInCent
      ? `${base} up to $${(promotion.maximumRedeemAmountInCent / 100).toFixed(2)}`
      : base;
  }

  return `$${(promotion.discountValue / 100).toFixed(2)} off`;
}

function getPromotionDiscountInCent(
  amountInCent: number,
  promotion: {
    discountType: "percent" | "fixed";
    discountValue: number;
    maximumRedeemAmountInCent?: number | null;
  },
) {
  const rawDiscount =
    promotion.discountType === "percent"
      ? Math.floor((amountInCent * promotion.discountValue) / 100)
      : promotion.discountValue;
  const cappedDiscount =
    promotion.maximumRedeemAmountInCent != null
      ? Math.min(rawDiscount, promotion.maximumRedeemAmountInCent)
      : rawDiscount;

  return Math.max(0, Math.min(amountInCent, cappedDiscount));
}

async function verifyCheckoutIdentity(userId: string) {
  const token = (await cookies()).get(authKey)?.value;
  if (!token) throw new Error("Authentication required.");
  const sessionUser = await decodedToken(token, getJwtSecret());
  if (!sessionUser.success || sessionUser.data?.id !== userId) {
    throw new Error("Invalid checkout session.");
  }
  return sessionUser.data;
}

function isStripeTaxUnsupported(error: unknown) {
  return (
    error instanceof Stripe.errors.StripeInvalidRequestError &&
    error.code === "stripe_tax_inactive"
  );
}

export async function validatePromotionCode(
  productId: string,
  userId: string,
  code: string,
) {
  assertStripeSecretKey();
  await syncPromotionStatuses();
  await verifyCheckoutIdentity(userId);
  const product = await prisma.products.findFirst({
    where: { id: productId, status: "public", isDeleted: false },
  });
  if (!product) throw new Error("Product not found.");
  if (!code.trim()) return { valid: true, code: "", label: "No promotion applied" };
  const promotion = await getEligiblePromotion(code, userId);
  if (!promotion) return { valid: true, code: "", label: "No promotion applied" };
  const productAmountInCent = Math.round(product.priceInDollar * 100);
  if (
    promotion.minimumAmountInCent != null &&
    productAmountInCent < promotion.minimumAmountInCent
  ) {
    throw new Error(
      `This code requires an order of at least $${(
        promotion.minimumAmountInCent / 100
      ).toFixed(2)}.`,
    );
  }
  const discountInCent = getPromotionDiscountInCent(productAmountInCent, promotion);
  return {
    valid: true,
    code: promotion.code,
    label: getPromotionLabel(promotion),
    discountInCent,
  };
}

export async function listAvailablePromotionCodes(
  productId: string,
  userId: string,
) {
  assertStripeSecretKey();
  await syncPromotionStatuses();
  await verifyCheckoutIdentity(userId);

  const product = await prisma.products.findFirst({
    where: { id: productId, status: "public", isDeleted: false },
  });
  if (!product) throw new Error("Product not found.");

  const productAmountInCent = Math.round(product.priceInDollar * 100);
  const now = new Date();
  const promotions = await prisma.promotions.findMany({
    where: {
      status: "active",
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const available = await Promise.all(
    promotions.map(async (promotion) => {
      if (
        promotion.maxRedemptions != null &&
        promotion.redemptionCount >= promotion.maxRedemptions
      ) {
        return null;
      }

      if (
        promotion.minimumAmountInCent != null &&
        productAmountInCent < promotion.minimumAmountInCent
      ) {
        return null;
      }

      if (promotion.maxRedemptionsPerCustomer != null) {
        const customerUses = await prisma.promotionRedemptions.count({
          where: { promotionId: promotion.id, userId },
        });
        if (customerUses >= promotion.maxRedemptionsPerCustomer) {
          return null;
        }
      }

      if (promotion.firstTimeCustomersOnly) {
        const paidPurchaseCount = await prisma.purchaseHistories.count({
          where: { userId, refundAt: null, isRefunded: false },
        });
        if (paidPurchaseCount > 0) {
          return null;
        }
      }

      return {
        code: promotion.code,
        label: getPromotionLabel(promotion),
        discountInCent: getPromotionDiscountInCent(
          productAmountInCent,
          promotion,
        ),
      };
    }),
  );

  return available.filter(
    (
      item,
    ): item is { code: string; label: string; discountInCent: number } =>
      item != null,
  );
}

export async function getClientSessionSecret(
  product: {
    priceInDollar: number;
    name: string;
    imageUrl: string;
    description: string;
    id: string;
  },
  user: { email: string; id: string },
  promotionCode = "",
) {
  assertStripeSecretKey();
  await syncPromotionStatuses();

  const sessionUser = await verifyCheckoutIdentity(user.id);

  const [settings, persistedProduct, persistedUser] = await Promise.all([
    prisma.businessSettings.findUnique({ where: { key: "default" } }),
    prisma.products.findFirst({ where: { id: product.id, status: "public", isDeleted: false } }),
    prisma.users.findFirst({ where: { id: user.id, email: sessionUser.email, isDeleted: false } }),
  ]);
  if (!persistedProduct || !persistedUser) throw new Error("Product or customer not found.");
  const promotion = promotionCode
    ? await getEligiblePromotion(promotionCode, persistedUser.id)
    : null;
  const productAmountInCent = Math.round(persistedProduct.priceInDollar * 100);
  if (
    promotion?.minimumAmountInCent != null &&
    productAmountInCent < promotion.minimumAmountInCent
  ) {
    throw new Error(
      `This code requires an order of at least $${(
        promotion.minimumAmountInCent / 100
      ).toFixed(2)}.`,
    );
  }
  const discountInCent = promotion
    ? getPromotionDiscountInCent(productAmountInCent, promotion)
    : 0;
  const finalAmountInCent = Math.max(0, productAmountInCent - discountInCent);
  const existingStripeCustomer = (
    await stripeServerClient.customers.list({
      email: persistedUser.email,
      limit: 1,
    })
  ).data[0];
  const sessionPayload: Stripe.Checkout.SessionCreateParams = {
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          product_data: {
            name: persistedProduct.name,
            images: [
              new URL(persistedProduct.imageUrl, process.env.NEXT_PUBLIC_APP_URL).href,
            ],
            description: persistedProduct.description,
          },
          unit_amount: finalAmountInCent,
        },
      },
    ],
    ui_mode: "embedded",
    mode: "payment",
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.id}/purchase/success?stripeSessionId={CHECKOUT_SESSION_ID}`,
    ...(existingStripeCustomer
      ? { customer: existingStripeCustomer.id }
      : { customer_email: persistedUser.email, customer_creation: "always" as const }),
    ...(existingStripeCustomer
      ? {
          customer_update: {
            address: "auto" as const,
            name: "auto" as const,
          },
        }
      : {}),
    payment_intent_data: {
      receipt_email: persistedUser.email,
    },
    tax_id_collection: { enabled: true },
    invoice_creation: { enabled: true },
    metadata: {
      productId: persistedProduct.id,
      userId: persistedUser.id,
      ...(promotion
        ? {
            promotionId: promotion.id,
            promotionCode: promotion.code,
            promotionLabel: getPromotionLabel(promotion),
            promotionDiscountInCent: String(discountInCent),
          }
        : {}),
    },
  };

  const shouldUseAutomaticTax = settings?.automaticTaxEnabled ?? false;
  if (shouldUseAutomaticTax) {
    sessionPayload.automatic_tax = { enabled: true };
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripeServerClient.checkout.sessions.create(sessionPayload);
  } catch (error) {
    if (!shouldUseAutomaticTax || !isStripeTaxUnsupported(error)) {
      throw error;
    }

    await prisma.businessSettings.upsert({
      where: { key: "default" },
      update: { automaticTaxEnabled: false },
      create: { key: "default", automaticTaxEnabled: false },
    });

    delete sessionPayload.automatic_tax;
    session = await stripeServerClient.checkout.sessions.create(sessionPayload);
  }

  if (session.client_secret == null) throw new Error("Client secret is null");

  return session.client_secret;
}
