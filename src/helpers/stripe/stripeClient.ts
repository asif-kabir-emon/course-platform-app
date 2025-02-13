import { loadStripe } from "@stripe/stripe-js";

export const stripeClientPromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
);
