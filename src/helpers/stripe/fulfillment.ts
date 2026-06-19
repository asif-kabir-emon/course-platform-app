import { Prisma } from "@prisma/client";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const processStripeCheckout = async (
  checkoutSession: Stripe.Checkout.Session,
) => {
  const productId = checkoutSession.metadata?.productId;
  const userId = checkoutSession.metadata?.userId;

  if (!["paid", "no_payment_required"].includes(checkoutSession.payment_status)) {
    throw new Error("Checkout session is not paid.");
  }

  if (productId == null || userId == null) {
    throw new Error("Missing metadata.");
  }

  const [existingPurchase, product, user] = await Promise.all([
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

  try {
    await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      if (!existingPurchase) {
        await transaction.purchaseHistories.create({
          data: {
            userId,
            productId,
            stripeSessionId: checkoutSession.id,
            pricePaidInCent:
              checkoutSession.amount_total ??
              Math.round(product.priceInDollar * 100),
            productDetails: {
              name: product.name,
              description: product.description,
              imageUrls: product.imageUrl,
            },
          },
        });
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

  return {
    productId,
    userId,
    repairedAccessCount: missingCourseIds.length,
  };
};
