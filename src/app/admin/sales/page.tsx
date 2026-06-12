"use client";
import PageHeader from "@/components/PageHeader";
import PurchaseTable, {
  PurchaseTableSkeleton,
} from "@/features/purchase/PurchaseTable";
import { useGetPurchaseHistoriesQuery } from "@/redux/api/purchaseApi";
import React from "react";

const SalesPage = () => {
  const { data: purchases, isLoading } = useGetPurchaseHistoriesQuery({});

  if (isLoading) {
    return (
      <div className="page-shell">
        <PageHeader title="Sales" />
        <PurchaseTableSkeleton />
      </div>
    );
  }

  if (purchases.success === false) {
    return (
      <div className="page-shell">
        <PageHeader title="Sales" />
        <div className="error-panel">
          Failed to fetch data. Try to refresh the page.
        </div>
      </div>
    );
  }

  if (!purchases.data || purchases.data.length === 0) {
    return (
      <div className="page-shell">
        <PageHeader title="Sales" />
        <div className="surface-panel px-6 py-10 text-center">
          <p className="font-medium">No sales recorded yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Completed purchases will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <PageHeader title="Sales" />
      <PurchaseTable purchases={purchases.data} />
    </div>
  );
};

export default SalesPage;
