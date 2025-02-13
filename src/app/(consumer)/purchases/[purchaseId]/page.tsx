"use client";
import LoadingSpinner from "@/components/LoadingSpinner";
import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate, formatPrice } from "@/lib/formatter";
import { cn } from "@/lib/utils";
import { useGetPurchaseHistoryByIdQuery } from "@/redux/api/purchaseApi";
import Link from "next/link";
import React, { Fragment, Suspense, use } from "react";

const PurchasePage = ({
  params,
}: {
  params: Promise<{ purchaseId: string }>;
}) => {
  const { purchaseId } = use(params);

  return (
    <div className="container my-5">
      <Suspense
        fallback={<LoadingSpinner className="my-6 md:my-28 size-16 mx-auto" />}
      >
        <SuspenseBoundary purchaseId={purchaseId} />
      </Suspense>
    </div>
  );
};

export default PurchasePage;

const SuspenseBoundary = ({ purchaseId }: { purchaseId: string }) => {
  const { data: purchase, isLoading } =
    useGetPurchaseHistoryByIdQuery(purchaseId);

  if (isLoading)
    return <LoadingSpinner className="my-6 md:my-28 size-16 mx-auto" />;

  if (purchase.success === false || !purchase.data) {
    return <div>Not found</div>;
  }

  return (
    <div className="container my-5">
      <PageHeader title="Purchase Details">
        {purchase.data.stripe.pricingRows.receiptUrl && (
          <Button variant="outline" asChild>
            <Link
              target="_blank"
              href={purchase.data.stripe.pricingRows.receiptUrl}
            >
              View Receipt
            </Link>
          </Button>
        )}{" "}
      </PageHeader>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col gap-1">
              <CardTitle>Receipt</CardTitle>
              <CardDescription>ID: {purchase.data.id}</CardDescription>
            </div>
            <Badge className="text-base">
              {purchase.data.refundAt ? "Refunded" : "Paid"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-4 grid grid-cols-2 gap-8 border-t pt-4">
          <div>
            <label className="text-sm text-muted-foreground">Date</label>
            <div>{formatDate(purchase.data.createdAt)}</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Product</label>
            <div>{purchase.data.productDetails.name}</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Customer</label>
            <div>
              {purchase.data.user.profile.firstName ||
              purchase.data.user.profile.lastName
                ? `${purchase.data.user.profile.firstName} ${purchase.data.user.profile.lastName}`
                : purchase.data.user.email.split("@")[0]}
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Seller</label>
            <div>{process.env.NEXT_PUBLIC_APP_NAME}</div>
          </div>
        </CardContent>
        <CardFooter className="grid grid-cols-2 gap-y-4 gap-x-8 border-t pt-4">
          {purchase.data.stripe.pricingRows.map(
            ({
              label,
              amountInDollars,
              isBold,
            }: {
              label: string;
              amountInDollars: number;
              isBold?: boolean;
            }) => (
              <Fragment key={label}>
                <div className={cn(isBold && "font-bold")}>{label}</div>
                <div className={cn("justify-self-end", isBold && "font-bold")}>
                  {formatPrice(amountInDollars, { showZeroAsNumber: true })}
                </div>
              </Fragment>
            ),
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
