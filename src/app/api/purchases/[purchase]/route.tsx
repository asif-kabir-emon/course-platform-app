import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";
import { PrismaClient } from "@prisma/client";
import { stripeServerClient } from "@/helpers/stripe/stripeServer";
import Stripe from "stripe";

const prisma = new PrismaClient();

function getReceiptUrl(paymentIntent: Stripe.PaymentIntent | string | null) {
  if (
    typeof paymentIntent === "string" ||
    typeof paymentIntent?.latest_charge === "string"
  ) {
    return;
  }

  return paymentIntent?.latest_charge?.receipt_url;
}

function getPricingRows(
  totalDetails: Stripe.Checkout.Session.TotalDetails | null,
  {
    total,
    subtotal,
    refund,
  }: { total: number; subtotal: number; refund?: number },
) {
  const pricingRows: {
    label: string;
    amountInDollars: number;
    isBold?: boolean;
  }[] = [];

  if (totalDetails?.breakdown != null) {
    totalDetails.breakdown.discounts.forEach((discount) => {
      pricingRows.push({
        label: `${discount.discount.coupon.name} (${discount.discount.coupon.percent_off}% off)`,
        amountInDollars: discount.amount / -100,
      });
    });
  }

  if (refund) {
    pricingRows.push({
      label: "Refund",
      amountInDollars: refund / -100,
    });
  }

  if (pricingRows.length === 0) {
    return [{ label: "Total", amountInDollars: total / 100, isBold: true }];
  }

  return [
    {
      label: "Subtotal",
      amountInDollars: subtotal / 100,
    },
    ...pricingRows,
    {
      label: "Total",
      amountInDollars: total / 100,
      isBold: true,
    },
  ];
}

export const GET = authGuard(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catchAsync(async (request: Request, context: any) => {
    const params = await context.params;
    const purchaseId = params.purchase;
    const user = request.user;

    // Check if user is authenticated or not
    if (!user || !user.id || !user.email) {
      return ApiError(401, "Unauthorized access!");
    }

    if (!purchaseId) {
      return ApiError(400, "Invalid purchase id!");
    }

    // Check if user exists with
    const isUserExist = await prisma.users.findFirst({
      where: {
        id: user.id,
        email: user.email,
      },
      include: {
        profile: true,
      },
    });

    if (!isUserExist) {
      return ApiError(404, "User not found!");
    }

    const purchase = await prisma.purchaseHistories.findFirst({
      where: {
        id: purchaseId,
        userId: user.id,
      },
    });

    if (!purchase) {
      return ApiError(404, "Purchase not found!");
    }

    const { payment_intent, total_details, amount_total, amount_subtotal } =
      await stripeServerClient.checkout.sessions.retrieve(
        purchase.stripeSessionId,
        {
          expand: [
            "payment_intent.latest_charge",
            "total_details.breakdown.discounts",
          ],
        },
      );

    const refundAmount =
      typeof payment_intent !== "string" &&
      typeof payment_intent?.latest_charge !== "string"
        ? payment_intent?.latest_charge?.amount_refunded
        : purchase.refundAt
        ? purchase.pricePaidInCent
        : undefined;

    return sendResponse({
      status: 200,
      message: "Purchase history fetched successfully!",
      success: true,
      data: {
        ...purchase,
        stripe: {
          receiptUrl: getReceiptUrl(payment_intent),
          pricingRows: getPricingRows(total_details, {
            total:
              (amount_total ?? purchase.pricePaidInCent) - (refundAmount ?? 0),
            subtotal: amount_subtotal ?? purchase.pricePaidInCent,
            refund: refundAmount,
          }),
        },
        user: isUserExist,
      },
    });
  }),
);
