import { Button } from "@/components/ui/button";
import { authKey } from "@/constants/AuthKey.constant";
import { processStripeCheckout } from "@/helpers/stripe/fulfillment";
import {
  assertStripeSecretKey,
  stripeServerClient,
} from "@/helpers/stripe/stripeServer";
import { prisma } from "@/lib/prisma";
import { getJwtSecret } from "@/utils/serverEnv";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import Stripe from "stripe";

const ProductPurchaseSuccessPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ stripeSessionId?: string }>;
}) => {
  const { productId } = await params;
  const { stripeSessionId } = await searchParams;
  const product = await prisma.products.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  });

  if (!product) {
    return <PurchaseState title="Product not found" href="/" cta="Go home" />;
  }

  let purchaseState:
    | {
        title: string;
        message: string;
        href: string;
        cta: string;
      }
    | undefined;

  try {
    assertStripeSecretKey();

    const currentUser = await getCurrentUserFromCookie();
    const checkoutSession = stripeSessionId
      ? await stripeServerClient.checkout.sessions.retrieve(stripeSessionId)
      : await findLatestPaidCheckoutSession({
          productId,
          userId: currentUser?.id,
          email: currentUser?.email,
        });

    if (!checkoutSession) {
      purchaseState = {
        title: "Purchase needs confirmation",
        message:
          "We could not find a paid Stripe checkout session for this product and account. Please check your purchase history or try again.",
        href: "/purchases",
        cta: "View purchases",
      };
    } else if (
      currentUser &&
      checkoutSession.metadata?.userId &&
      checkoutSession.metadata.userId !== currentUser.id
    ) {
      throw new Error("Checkout session belongs to a different user.");
    } else {
      if (
        !checkoutSession.metadata?.userId &&
        currentUser?.id &&
        checkoutSession.customer_details?.email === currentUser.email
      ) {
        checkoutSession.metadata = {
          ...checkoutSession.metadata,
          userId: currentUser.id,
        };
      }

      if (checkoutSession.metadata?.productId !== productId) {
        throw new Error("Checkout session does not match this product.");
      }

      if (checkoutSession.payment_status === "unpaid") {
        purchaseState = {
          title: "Payment pending",
          message:
            "Your payment is still processing. We will unlock the course when Stripe confirms the payment.",
          href: "/products/purchase-pending",
          cta: "View payment status",
        };
      } else {
        await processStripeCheckout(checkoutSession);
        purchaseState = {
          title: "Purchase successful",
          message: `Thank you for purchasing ${product.name}. Your course access has been saved.`,
          href: "/courses",
          cta: "View My Courses",
        };
      }
    }
  } catch (error) {
    console.error(
      "Purchase success confirmation failed:",
      error instanceof Error ? error.message : "Unknown checkout error",
    );

    purchaseState = {
      title: "Purchase confirmation failed",
      message:
        "Payment may have succeeded, but we could not save the purchase in the database. Please contact support or try opening purchase history.",
      href: "/purchases",
      cta: "View purchases",
    };
  }

  return (
    <PurchaseState
      product={product}
      title={purchaseState.title}
      message={purchaseState.message}
      href={purchaseState.href}
      cta={purchaseState.cta}
    />
  );
};

const getCurrentUserFromCookie = async () => {
  const token = (await cookies()).get(authKey)?.value;
  if (!token) return null;

  try {
    const decoded = await jwtVerify(
      token,
      new TextEncoder().encode(getJwtSecret()),
    );
    const payload = decoded.payload as jwtPayload;

    if (!payload.id || !payload.email) return null;

    return {
      id: payload.id,
      email: payload.email,
    };
  } catch {
    return null;
  }
};

const findLatestPaidCheckoutSession = async ({
  productId,
  userId,
  email,
}: {
  productId: string;
  userId?: string;
  email?: string;
}): Promise<Stripe.Checkout.Session | null> => {
  if (!userId && !email) return null;

  let startingAfter: string | undefined;

  for (let page = 0; page < 5; page += 1) {
    const sessions = await stripeServerClient.checkout.sessions.list({
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    const matchingSession = sessions.data.find((session) => {
      const matchesProduct = session.metadata?.productId === productId;
      const matchesUser =
        (userId && session.metadata?.userId === userId) ||
        (email &&
          (session.customer_details?.email === email ||
            session.customer_email === email));

      return (
        matchesProduct &&
        matchesUser &&
        session.status === "complete" &&
        ["paid", "no_payment_required"].includes(session.payment_status)
      );
    });

    if (matchingSession) return matchingSession;
    if (!sessions.has_more) break;

    startingAfter = sessions.data.at(-1)?.id;
    if (!startingAfter) break;
  }

  return null;
};

export default ProductPurchaseSuccessPage;

const PurchaseState = ({
  product,
  title,
  message,
  href,
  cta,
}: {
  product?: { name: string; imageUrl: string };
  title: string;
  message?: string;
  href: string;
  cta: string;
}) => {
  return (
    <div className="container my-8">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        {product && (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={520}
            height={320}
            className="aspect-video w-full max-w-lg rounded-xl object-cover"
            priority
          />
        )}
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold capitalize">{title}</h1>
          {message && (
            <p className="mx-auto max-w-xl text-lg leading-7 text-muted-foreground">
              {message}
            </p>
          )}
        </div>
        <Button asChild size="lg" className="rounded-lg px-8">
          <Link href={href}>{cta}</Link>
        </Button>
      </div>
    </div>
  );
};
