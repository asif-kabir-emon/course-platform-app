"use client";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  useCheckUserAccessQuery,
  useGetProductByIdQuery,
} from "@/redux/api/productApi";
import { useGetUserProfileQuery } from "@/redux/api/profileApi";
import { notFound, redirect } from "next/navigation";
import React, { Suspense, use } from "react";
import PageHeader from "@/components/PageHeader";
import StripeCheckoutForm from "@/components/features/StripeCheckoutForm";

const PurchasePage = ({
  params,
}: {
  params: Promise<{ productId: string }>;
}) => {
  const { productId } = use(params);

  console.log(productId);

  return (
    <Suspense
      fallback={<LoadingSpinner className="my-6 md:my-28 size-16 mx-auto" />}
    >
      <SuspendedComponent params={params} />
    </Suspense>
  );
};

export default PurchasePage;

const SuspendedComponent = ({
  params,
}: {
  params: Promise<{ productId: string }>;
}) => {
  const { productId } = use(params);

  const { data: userProfile, isLoading: isFetchUserProfileData } =
    useGetUserProfileQuery({});
  const { data: product, isLoading: isFetchingProductData } =
    useGetProductByIdQuery(productId);
  const { data: userAccess } = useCheckUserAccessQuery(productId);

  if (
    !isFetchingProductData &&
    (product.success === false || product.data.length === 0)
  )
    return notFound();

  if (
    !isFetchingProductData &&
    (product.success === true || product.data.length !== 0)
  ) {
    const hasAccess = userAccess?.success && userAccess?.data.hasAccess;
    if (!isFetchUserProfileData && userProfile.success === true && hasAccess) {
      return redirect("/courses");
    }

    if (!isFetchUserProfileData && userProfile.success === true) {
      return (
        <div className="container my-5">
          <StripeCheckoutForm product={product.data} user={userProfile.data} />
        </div>
      );
    }
  }

  const isSignUpMode = !isFetchUserProfileData && userProfile.success === false;

  if (isSignUpMode) {
    redirect(`/sign-in?redirect=/products/${productId}/purchase`);
  }

  return (
    <div className="container my-5 flex flex-col items-center">
      {isSignUpMode && (
        <PageHeader title="You need an account to make a purchase" />
      )}
    </div>
  );
};
