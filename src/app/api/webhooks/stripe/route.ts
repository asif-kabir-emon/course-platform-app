import { stripeServerClient } from "@/helpers/stripe/stripeServer";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const GET = async (req: NextRequest) => {
  const stripeSessionId = await req.nextUrl.searchParams.get("stripeSessionId");
  if (stripeSessionId == null) {
    redirect("/products/purchase-failure");
  }

  let redirectUrl: string;

  try {
    const checkoutSession =
      await stripeServerClient.checkout.sessions.retrieve(stripeSessionId);
    const productId = checkoutSession.metadata?.productId;

    if (!productId) {
      throw new Error("Checkout product is missing.");
    }

    if (checkoutSession.payment_status === "unpaid") {
      redirectUrl = "/products/purchase-pending";
    } else {
      redirectUrl = `/products/${productId}/purchase/success`;
    }
  } catch {
    redirectUrl = "/products/purchase-failure";
  }

  return NextResponse.redirect(
    new URL(redirectUrl, process.env.NEXT_PUBLIC_APP_URL),
  );
};

export const POST = async (req: NextRequest) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return new Response("Missing Stripe webhook configuration.", {
      status: 400,
    });
  }

  let event: Stripe.Event;

  try {
    event = stripeServerClient.webhooks.constructEvent(
      await req.text(),
      signature,
      webhookSecret,
    );
  } catch {
    return new Response("Invalid Stripe webhook signature.", { status: 400 });
  }

  const existingEvent = await prisma.stripeWebhookEvents.findUnique({
    where: { eventId: event.id },
  });

  if (existingEvent?.status === "processed") {
    return new Response(null, { status: 200 });
  }

  await prisma.stripeWebhookEvents.upsert({
    where: { eventId: event.id },
    update: {
      status: "processing",
      attempts: { increment: 1 },
      lastError: null,
    },
    create: {
      eventId: event.id,
      eventType: event.type,
      status: "processing",
    },
  });

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        if (
          !["paid", "no_payment_required"].includes(
            event.data.object.payment_status,
          )
        ) {
          break;
        }

        await processStripeCheckout(event.data.object);
        break;
    }

    await prisma.stripeWebhookEvents.update({
      where: { eventId: event.id },
      data: {
        status: "processed",
        processedAt: new Date(),
        lastError: null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown fulfillment error";

    await prisma.stripeWebhookEvents.update({
      where: { eventId: event.id },
      data: {
        status: "failed",
        lastError: message.slice(0, 1000),
      },
    });
    console.error("Stripe fulfillment failed:", message);
    return new Response(null, { status: 500 });
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

  const existingPurchase = await prisma.purchaseHistories.findUnique({
    where: {
      stripeSessionId: checkoutSession.id,
    },
  });

  if (existingPurchase) {
    return existingPurchase.productId;
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

  try {
    await prisma.$transaction(async (trc: Prisma.TransactionClient) => {
      await trc.purchaseHistories.create({
        data: {
          userId,
          productId,
          stripeSessionId: checkoutSession.id,
          pricePaidInCent:
            checkoutSession.amount_total ?? product.priceInDollar * 100,
          productDetails: {
            name: product.name,
            description: product.description,
            imageUrls: product.imageUrl,
          },
        },
      });

      if (needToPurchaseCourses.length > 0) {
        await trc.userCourseAccess.createMany({
          data: needToPurchaseCourses.map((courseId) => ({
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
      return productId;
    }

    throw error;
  }

  return productId;
};
