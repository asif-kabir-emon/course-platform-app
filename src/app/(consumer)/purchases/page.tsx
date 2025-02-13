"use client";
import UserPurchaseTable, {
  UserPurchaseTableSkeleton,
} from "@/components/features/UserPurchaseTable";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useGetPurchaseHistoryQuery } from "@/redux/api/purchaseApi";
import Link from "next/link";
import React, { Suspense } from "react";

const PurchasesPage = () => {
  return (
    <div className="container my-5">
      <PageHeader title="Purchase History" />
      <Suspense fallback={<UserPurchaseTableSkeleton />}>
        <SuspenseBoundary />
      </Suspense>
    </div>
  );
};

export default PurchasesPage;

const SuspenseBoundary = () => {
  const { data: purchases, isLoading } = useGetPurchaseHistoryQuery({});

  if (isLoading) {
    return <UserPurchaseTableSkeleton />;
  }

  if (purchases.data.length === 0) {
    return (
      <div className="flex flex-col gap-2 items-start">
        You have made no purchases yet.
        <Button size="lg" asChild>
          <Link href="/">Browse Courses</Link>
        </Button>
      </div>
    );
  }

  return <UserPurchaseTable purchases={purchases.data} />;
};
