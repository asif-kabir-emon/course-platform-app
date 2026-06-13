"use client";
import PageHeader from "@/components/PageHeader";
import PurchaseTable, {
  PurchaseTableSkeleton,
} from "@/features/purchase/PurchaseTable";
import { useGetPurchaseHistoriesQuery } from "@/redux/api/purchaseApi";
import React from "react";
import { useState } from "react";
import PaginationControls from "@/components/PaginationControls";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useClientSession } from "@/hooks/useClientSession";
import { isSuperAdminRole } from "@/constants/UserRole.constant";

const SalesPage = () => {
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const { session } = useClientSession();
  const { data: purchases, isLoading } = useGetPurchaseHistoriesQuery({
    page,
    pageSize,
    search,
    status,
  });

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
      <form
        className="surface-panel mb-4 grid gap-3 p-4 sm:grid-cols-[minmax(220px,1fr)_180px_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setSearch(searchInput.trim());
        }}
      >
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search customer or product..."
          aria-label="Search sales"
        />
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="h-10 rounded-lg border bg-background px-3 text-sm"
          aria-label="Filter sales by status"
        >
          <option value="all">All payments</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>
        <Button type="submit">Search</Button>
      </form>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <PurchaseTable
          purchases={purchases.data}
          embedded
          canRefund={isSuperAdminRole(session?.role)}
        />
        <PaginationControls
          page={purchases.meta.page}
          totalPages={purchases.meta.totalPages}
          total={purchases.meta.total}
          pageSize={purchases.meta.pageSize}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default SalesPage;
