import { stripeServerClient } from "@/helpers/stripe/stripeServer";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const GET = async (req: NextRequest) => {
  const stripeSessionId = await req.nextUrl.searchParams.get("stripeSessionId");
  if (stripeSessionId == null) {
    redirect("/products/purchase-failure");
  }

  let redirectUrl: string;

  try {
    const checkoutSession = await stripeServerClient.checkout.sessions.retrieve(
      stripeSessionId,
      {
        expand: ["line_items"],
      },
    );

    const productId = await processStripeCheckout(checkoutSession);

    redirectUrl = `/products/${productId}/purchase/success`;
  } catch {
    redirectUrl = "/products/purchase-failure";
  }

  return NextResponse.redirect(
    new URL(redirectUrl, process.env.NEXT_PUBLIC_SERVER_URL),
  );
};

export const POST = async (req: NextRequest) => {
  const event = await stripeServerClient.webhooks.constructEvent(
    await req.text(),
    req.headers.get("stripe-signature") as string,
    process.env.STRIPE_WEBHOOK_SECRET as string,
  );

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      try {
        await processStripeCheckout(event.data.object);
      } catch {
        return new Response(null, { status: 500 });
      }
  }

  return new Response(null, { status: 200 });
};

const processStripeCheckout = async (
  checkoutSession: Stripe.Checkout.Session,
) => {
  const productId = checkoutSession.metadata?.productId;
  const userId = checkoutSession.metadata?.userId;

  if (productId == null || userId == null) {
    throw new Error("Missing metadata");
  }

  const product = await prisma.products.findFirst({
    where: {
      id: productId,
    },
    include: {
      courseProducts: true,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  const user = await prisma.users.findFirst({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const courseIds = product.courseProducts.map((courseProduct) => {
    return courseProduct.courseId;
  });

  const userHasAccessToCourses = await prisma.userCourseAccess.findMany({
    where: {
      userId: userId,
      courseId: {
        in: courseIds,
      },
    },
  });

  const needToPurchaseCourses = courseIds.filter((courseId) => {
    return !userHasAccessToCourses.some((userCourseAccess) => {
      return userCourseAccess.courseId === courseId;
    });
  });

  if (needToPurchaseCourses.length === 0) {
    throw new Error("User already has access to all courses");
  }

  await prisma.$transaction(async (trc: Prisma.TransactionClient) => {
    const userCourseAccess = await trc.userCourseAccess.createMany({
      data: needToPurchaseCourses.map((courseId) => {
        return {
          userId: userId,
          courseId: courseId,
        };
      }),
    });

    if (!userCourseAccess) {
      throw new Error("User course access not created");
    }

    const purchaseHistory = await trc.purchaseHistories.create({
      data: {
        userId: userId,
        productId: productId,
        stripeSessionId: checkoutSession.id,
        pricePaidInCent:
          checkoutSession.amount_total || product.priceInDollar * 100,
        productDetails: {
          name: product.name,
          description: product.description,
          imageUrls: product.imageUrl,
        },
      },
    });

    if (!purchaseHistory) {
      throw new Error("Purchase history not created");
    }
  });
  return productId;
};
