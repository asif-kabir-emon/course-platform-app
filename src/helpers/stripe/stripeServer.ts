import Stripe from "stripe";

export const assertStripeSecretKey = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  if (!secretKey.startsWith("sk_")) {
    throw new Error(
      "STRIPE_SECRET_KEY must be a secret key that starts with sk_. Do not use the pk_ publishable key on the server.",
    );
  }

  return secretKey;
};

export const stripeServerClient = new Stripe(
  process.env.STRIPE_SECRET_KEY as string,
);
