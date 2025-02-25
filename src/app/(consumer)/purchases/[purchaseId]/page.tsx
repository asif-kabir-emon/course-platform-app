"use client";
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
      <Suspense fallback={<div className="container my-5">Loading...</div>}>
        <SuspenseBoundary purchaseId={purchaseId} />
      </Suspense>
    </div>
  );
};

export default PurchasePage;

const SuspenseBoundary = ({ purchaseId }: { purchaseId: string }) => {
  const { data: purchase, isLoading } =
    useGetPurchaseHistoryByIdQuery(purchaseId);

  if (isLoading) return <div className="container my-5">Loading...</div>;

  if (
    purchase.success === false ||
    !purchase.data ||
    purchase.data.length === 0
  ) {
    return (
      <div className="container my-8">
        <div className="border border-l-[5px] border-l-red-600 mb-4 px-4 py-4 rounded-r-md text-sm text-muted-foreground">
          Failed to fetch data. Try to refresh the page.
        </div>
      </div>
    );
  }

  return (
    <div className="my-5">
      <PageHeader title="Purchase Details">
        {purchase.data.stripe.receiptUrl && (
          <Button
            variant="outline"
            className="hover:bg-neutral-800 hidden md:block"
            asChild
          >
            <Link target="_blank" href={purchase.data.stripe.receiptUrl}>
              View Receipt
            </Link>
          </Button>
        )}
      </PageHeader>

      {purchase.data.stripe.receiptUrl && (
        <Button
          variant="outline"
          className="hover:bg-neutral-800 md:hidden mb-5 mt-[-80px]"
          asChild
        >
          <Link target="_blank" href={purchase.data.stripe.receiptUrl}>
            View Receipt
          </Link>
        </Button>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="flex flex-col gap-1">
              <CardTitle>Receipt</CardTitle>
              <CardDescription>ID: {purchase.data.id}</CardDescription>
            </div>
            <Badge className="text-base">
              {purchase.data.refundAt ? "Refunded" : "Paid"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-4 grid md:grid-cols-2 gap-8 border-t pt-4">
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
