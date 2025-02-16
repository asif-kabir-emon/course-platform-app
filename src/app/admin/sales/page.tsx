"use client";
import PageHeader from "@/components/PageHeader";
import PurchaseTable, { PurchaseTableSkeleton } from "@/features/PurchaseTable";
import { useGetPurchaseHistoriesQuery } from "@/redux/api/purchaseApi";
import React from "react";

const SalesPage = () => {
  const { data: purchases, isLoading } = useGetPurchaseHistoriesQuery({});

  if (isLoading) {
    return (
      <div className="container my-8">
        <PageHeader title="Sales" />
        <PurchaseTableSkeleton />
      </div>
    );
  }

  if (purchases.success === false) {
    return (
      <div className="container my-8">
        <PageHeader title="Sales" />
        <div className="border border-l-[5px] border-l-red-600 mb-4 px-4 py-4 rounded-r-md text-sm text-muted-foreground">
          Failed to fetch data. Try to refresh the page.
        </div>
      </div>
    );
  }

  if (!purchases.data || purchases.data.length === 0) {
    return (
      <div className="container my-8">
        <PageHeader title="Sales" />
        <div>No Purchase History found.</div>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <PageHeader title="Sales" />
      <PurchaseTable purchases={purchases.data} />
    </div>
  );
};

export default SalesPage;
