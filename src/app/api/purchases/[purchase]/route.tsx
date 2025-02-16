import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";
import { Prisma, PrismaClient, UserRole } from "@prisma/client";
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

export const PUT = authGuard(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catchAsync(async (request: Request, context: any) => {
    const params = await context.params;
    const purchaseId = params.purchase;
    const user = request.user;

    // Check if user is authenticated or not
    if (
      !user ||
      !user.id ||
      !user.email ||
      !user.role ||
      user.role !== UserRole.admin ||
      !purchaseId
    ) {
      return ApiError(401, "Unauthorized access!");
    }

    const isPurchaseExist = await prisma.purchaseHistories.findFirst({
      where: {
        id: purchaseId,
      },
      include: {
        product: {
          include: {
            courseProducts: {
              select: {
                courseId: true,
              },
            },
          },
        },
      },
    });

    if (!isPurchaseExist || isPurchaseExist.refundAt !== null) {
      return ApiError(404, "Purchase not found!");
    }

    // If purchase is within 30 days then refund the purchase
    const purchaseDate = new Date(isPurchaseExist.createdAt);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - purchaseDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      return ApiError(400, "Can't refund after 30 days of purchase!");
    }

    const otherPurchases = await prisma.purchaseHistories.findMany({
      where: {
        id: {
          not: purchaseId,
        },
        refundAt: null,
        isRefunded: false,
      },
      include: {
        product: {
          include: {
            courseProducts: {
              select: {
                courseId: true,
              },
            },
          },
        },
      },
    });

    const productRelatedCourseIds = isPurchaseExist.product.courseProducts.map(
      (course) => course.courseId,
    );

    const otherPurchasesCourseIds =
      otherPurchases.length > 0
        ? otherPurchases.flatMap((purchase) =>
            purchase.product.courseProducts.map((course) => course.courseId),
          )
        : [];

    // Need to remove course access from user which is not related to other purchases

    const needToRemoveCourseAccess = productRelatedCourseIds.filter(
      (courseId) => !otherPurchasesCourseIds.includes(courseId),
    );

    // console.log("productRelatedCourseIds", productRelatedCourseIds);
    // console.log("otherPurchasesCourseIds", otherPurchasesCourseIds);
    // console.log("needToRemoveCourseAccess", needToRemoveCourseAccess);

    const refund = await prisma.$transaction(
      async (tsc: Prisma.TransactionClient) => {
        const session = await stripeServerClient.checkout.sessions.retrieve(
          isPurchaseExist.stripeSessionId,
        );

        if (!session.payment_intent) {
          return ApiError(400, "Payment intent not found!");
        }

        await stripeServerClient.refunds.create({
          payment_intent:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent.id,
        });

        await tsc.purchaseHistories.update({
          where: {
            id: purchaseId,
          },
          data: {
            refundAt: new Date(),
            isRefunded: true,
          },
        });

        await tsc.userCourseAccess.deleteMany({
          where: {
            userId: isPurchaseExist.userId,
            courseId: {
              in: needToRemoveCourseAccess,
            },
          },
        });

        return session;
      },
    );

    return sendResponse({
      status: 200,
      message: "Purchase refunded successfully!",
      success: true,
      data: refund,
    });
  }),
);
