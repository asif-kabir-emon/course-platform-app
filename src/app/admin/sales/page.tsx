"use client";
import PageHeader from "@/components/PageHeader";
import PurchaseTable, {
  PurchaseTableSkeleton,
} from "@/features/purchase/PurchaseTable";
import { useGetPurchaseHistoriesQuery } from "@/redux/api/purchaseApi";
import React, { useEffect, useState } from "react";
import PaginationControls from "@/components/PaginationControls";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useClientSession } from "@/hooks/useClientSession";
import { isSuperAdminRole } from "@/constants/UserRole.constant";
import {
  RotateCcw,
  Search,
} from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import ResponsiveFilterSelect from "@/components/ResponsiveFilterSelect";
import MobileFilterDialog from "@/components/MobileFilterDialog";

const paymentStatusOptions = [
  { value: "all", label: "All payments" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
];

const SalesPage = () => {
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("all");
  const search = useDebouncedValue(searchInput.trim());
  const hasFilters = searchInput.trim().length > 0 || status !== "all";
  const activeFilterCount =
    Number(searchInput.trim().length > 0) + Number(status !== "all");
  const { session } = useClientSession();
  const { data: purchases, isLoading } = useGetPurchaseHistoriesQuery({
    page,
    pageSize,
    search,
    status,
  });

  useEffect(() => {
    setPage(1);
  }, [search, status]);

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

  return (
    <div className="page-shell">
      <PageHeader title="Sales" />
      <div className="mb-4">
        <MobileFilterDialog
          activeFilterCount={activeFilterCount}
          title="Filter sales"
          description="Search customers or products and filter payment status."
        >
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search customer or product..."
              aria-label="Search sales"
              className="h-11 pl-9"
            />
          </label>
          <ResponsiveFilterSelect
            value={status}
            onValueChange={setStatus}
            options={paymentStatusOptions}
            label="Filter sales by payment status"
            mobilePresentation="popover"
          />
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setSearchInput("");
                setStatus("all");
                setPage(1);
              }}
            >
              <RotateCcw className="size-4" />
              Reset filters
            </Button>
          )}
        </MobileFilterDialog>
      </div>
      <div className="mb-4 hidden gap-3 sm:grid sm:grid-cols-[minmax(260px,1fr)_190px_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search customer or product..."
              aria-label="Search sales"
              className="h-11 pl-9"
            />
          </label>
          <ResponsiveFilterSelect
            value={status}
            onValueChange={setStatus}
            options={paymentStatusOptions}
            label="Filter sales by payment status"
          />
          {hasFilters && (
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => {
                setSearchInput("");
                setStatus("all");
                setPage(1);
              }}
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
          )}
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {purchases.data?.length > 0 ? (
          <PurchaseTable
            purchases={purchases.data}
            embedded
            canRefund={isSuperAdminRole(session?.role)}
          />
        ) : (
          <div className="flex min-h-44 flex-col items-center justify-center px-6 text-center">
            <p className="font-medium">
              {hasFilters
                ? "No sales match these filters."
                : "No sales recorded yet."}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasFilters
                ? "Adjust the customer, product, or payment filter."
                : "Completed purchases will appear here."}
            </p>
          </div>
        )}
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
