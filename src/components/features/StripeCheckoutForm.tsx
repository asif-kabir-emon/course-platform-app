"use client";
import React from "react";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { getClientSessionSecret } from "@/helpers/stripe/stripe";
import { stripeClientPromise } from "@/helpers/stripe/stripeClient";

const StripeCheckoutForm = ({
  product,
  user,
}: {
  product: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    priceInDollar: number;
  };
  user: {
    email: string;
    id: string;
  };
}) => {
  return (
    <EmbeddedCheckoutProvider
      stripe={stripeClientPromise}
      options={{
        fetchClientSecret: getClientSessionSecret.bind(null, product, user),
      }}
    >
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
};

export default StripeCheckoutForm;
