import {
  assertStripeSecretKey,
  stripeServerClient,
} from "@/helpers/stripe/stripeServer";
import { processStripeCheckout } from "@/helpers/stripe/fulfillment";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const GET = async (req: NextRequest) => {
  const stripeSessionId = await req.nextUrl.searchParams.get("stripeSessionId");
  if (stripeSessionId == null) {
    redirect("/products/purchase-failure");
  }

  let redirectUrl: string;

  try {
    assertStripeSecretKey();

    const checkoutSession =
      await stripeServerClient.checkout.sessions.retrieve(stripeSessionId);
    const productId = checkoutSession.metadata?.productId;

    if (!productId) {
      throw new Error("Checkout product is missing.");
    }

    if (checkoutSession.payment_status === "unpaid") {
      redirectUrl = "/products/purchase-pending";
    } else {
      await processStripeCheckout(checkoutSession);
      redirectUrl = `/products/${productId}/purchase/success?stripeSessionId=${encodeURIComponent(stripeSessionId)}`;
    }
  } catch {
    redirectUrl = "/products/purchase-failure";
  }

  return NextResponse.redirect(
    new URL(redirectUrl, process.env.NEXT_PUBLIC_APP_URL),
  );
};

export const POST = async (req: NextRequest) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({
      received: true,
      skipped: true,
      message:
        "Stripe webhook signing secret is not configured. Checkout success handles fulfillment.",
    });
  }

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing Stripe webhook signature.", {
      status: 400,
    });
  }

  let event: Stripe.Event;

  try {
    assertStripeSecretKey();

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
