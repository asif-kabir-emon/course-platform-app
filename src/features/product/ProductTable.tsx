import { Button } from "@/components/ui/button";
import PaginationControls from "@/components/PaginationControls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPlural, formatPrice } from "@/lib/formatter";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  Archive,
  Copy,
  MoreVertical,
  RotateCcw as ResetIcon,
  EyeIcon,
  LockIcon,
  Pencil,
  Search,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ProductStatus } from "@/constants/ProductStatus.constant";
import {
  useGetProductsQuery,
  useUpdateProductActionMutation,
} from "@/hooks/product.hook";
import { TableSkeleton } from "@/components/Skeleton";
import { Input } from "@/components/ui/input";
import { useClientSession } from "@/hooks/useClientSession";
import { isSuperAdminRole } from "@/constants/UserRole.constant";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import ResponsiveFilterSelect from "@/components/ResponsiveFilterSelect";
import MobileFilterDialog from "@/components/MobileFilterDialog";

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

const visibilityOptions = [
  { value: "active", label: "Active products" },
  { value: "archived", label: "Archived products" },
  { value: "all", label: "All products" },
];

const ProductTable = () => {
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("all");
  const [visibility, setVisibility] = useState("active");
  const search = useDebouncedValue(searchInput.trim());
  const hasFilters =
    searchInput.trim().length > 0 ||
    status !== "all" ||
    visibility !== "active";
  const activeFilterCount =
    Number(searchInput.trim().length > 0) +
    Number(status !== "all") +
    Number(visibility !== "active");
  const { session } = useClientSession();
  const isSuperAdmin = isSuperAdminRole(session?.role);
  const { data: products, isLoading: isFetchingData } = useGetProductsQuery({
    showAllProducts: true,
    paginate: true,
    page,
    pageSize,
    search,
    status,
    visibility,
  });
  const [updateProductAction, { isLoading: isUpdatingProduct }] =
    useUpdateProductActionMutation();

  useEffect(() => {
    setPage(1);
  }, [search, status, visibility]);

  if (isFetchingData) {
    return <TableSkeleton columns={4} withMedia />;
  }

  if (!products || products.success === false) {
    return null;
  }

  const handleProductAction = async (
    id: string,
    action: "publish" | "unpublish" | "archive" | "restore",
  ) => {
    const toastId = toast.loading("Updating product...");
    try {
      const response = await updateProductAction({ id, action }).unwrap();

      if (response.success) {
        toast.success(response.message, { id: toastId });
      } else {
        toast.error(response.message, { id: toastId });
      }
    } catch {
      toast.error("Failed to update product.", { id: toastId });
    }
  };

  return (
    <div className="space-y-4">
      <MobileFilterDialog
        activeFilterCount={activeFilterCount}
        title="Filter products"
        description="Search products and narrow the list by status."
      >
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
            className="h-11 pl-9"
          />
        </label>
        <ResponsiveFilterSelect
          value={status}
          onValueChange={setStatus}
          options={statusOptions}
          label="Filter products by status"
          mobilePresentation="popover"
        />
        <ResponsiveFilterSelect
          value={visibility}
          onValueChange={setVisibility}
          options={visibilityOptions}
          label="Filter active or archived products"
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
              setVisibility("active");
              setPage(1);
            }}
          >
            <ResetIcon className="size-4" />
            Reset filters
          </Button>
        )}
      </MobileFilterDialog>
      <div className="hidden gap-3 sm:grid lg:grid-cols-[minmax(280px,1fr)_190px_190px_auto]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
            className="h-11 pl-9"
          />
        </label>
        <ResponsiveFilterSelect
          value={status}
          onValueChange={setStatus}
          options={statusOptions}
          label="Filter products by status"
        />
        <ResponsiveFilterSelect
          value={visibility}
          onValueChange={setVisibility}
          options={visibilityOptions}
          label="Filter active or archived products"
        />
        {hasFilters && (
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => {
              setSearchInput("");
              setStatus("all");
              setVisibility("active");
              setPage(1);
            }}
          >
            <ResetIcon className="size-4" />
            Reset
          </Button>
        )}
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[300px]">
                {formatPlural(
                  products?.data?.length,
                  {
                    singular: "product",
                    plural: "products",
                  },
                  {
                    includeCount: false,
                  },
                )}
              </TableHead>
              <TableHead>Customers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[1%] whitespace-nowrap text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-44 text-center">
                  <p className="font-medium">
                    No products match these filters.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Adjust the search, status, or archive filter.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              products.data.map(
                (product: {
                  id: string;
                  name: string;
                  description: string;
                  imageUrl: string;
                  priceInDollar: number;
                  status: ProductStatus;
                  isDeleted: boolean;
                  coursesCount: number;
                  customersCount: number;
                }) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          width={192}
                          height={192}
                          className="object-cover rounded size-12"
                        />
                        <div className="flex flex-col gap-1">
                          <div className="font-semibold">{product.name}</div>
                          <div className="text-muted-foreground">
                            {formatPlural(
                              product.coursesCount,
                              {
                                singular: "course",
                                plural: "courses",
                              },
                              {
                                includeCount: true,
                              },
                            )}
                            {" • "}
                            {formatPrice(product.priceInDollar)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.customersCount}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          product.isDeleted
                            ? "inline-flex items-center gap-1.5 rounded-full border-slate-200 bg-slate-100 px-2.5 py-1 font-semibold text-slate-600"
                            : getStatusClassName(product.status)
                        }
                      >
                        {product.isDeleted ? (
                          <Archive className="size-3.5" />
                        ) : (
                          getStatusIcon(product.status)
                        )}
                        <span className="capitalize">
                          {product.isDeleted ? "Archived" : product.status}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[1%] whitespace-nowrap text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isUpdatingProduct}
                            aria-label={`Open actions for ${product.name}`}
                            className="rounded-none text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          >
                            <MoreVertical />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel>Product actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            asChild
                            className="focus:bg-primary/10 focus:text-primary"
                          >
                            <Link href={`/products/${product.id}`}>
                              <Store />
                              View storefront
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            asChild
                            className="focus:bg-primary/10 focus:text-primary"
                          >
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <Pencil />
                              Manage product
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="focus:bg-primary/10 focus:text-primary"
                            onSelect={() => {
                              void navigator.clipboard.writeText(
                                `${window.location.origin}/products/${product.id}`,
                              );
                              toast.success("Product link copied.");
                            }}
                          >
                            <Copy />
                            Copy product link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {!product.isDeleted && (
                            <DropdownMenuItem
                              className="focus:bg-primary/10 focus:text-primary"
                              onSelect={() =>
                                void handleProductAction(
                                  product.id,
                                  product.status === ProductStatus.public
                                    ? "unpublish"
                                    : "publish",
                                )
                              }
                            >
                              {product.status === ProductStatus.public ? (
                                <LockIcon />
                              ) : (
                                <EyeIcon />
                              )}
                              {product.status === ProductStatus.public
                                ? "Make private"
                                : "Publish product"}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="focus:bg-destructive/10 focus:text-destructive"
                            disabled={!isSuperAdmin}
                            onSelect={() =>
                              isSuperAdmin
                                ? void handleProductAction(
                                    product.id,
                                    product.isDeleted ? "restore" : "archive",
                                  )
                                : undefined
                            }
                          >
                            {product.isDeleted ? <ResetIcon /> : <Archive />}
                            {product.isDeleted
                              ? "Restore product"
                              : "Archive product"}
                            {!isSuperAdmin && (
                              <span className="ml-auto text-[10px] uppercase">
                                Super admin
                              </span>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ),
              )
            )}
          </TableBody>
        </Table>
        <PaginationControls
          page={products.meta.page}
          totalPages={products.meta.totalPages}
          total={products.meta.total}
          pageSize={products.meta.pageSize}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default ProductTable;

const getStatusIcon = (status: ProductStatus) => {
  const Icon = {
    [ProductStatus.public]: EyeIcon,
    [ProductStatus.private]: LockIcon,
  }[status];

  return <Icon className="size-3.5" aria-hidden="true" />;
};

const getStatusClassName = (status: ProductStatus) => {
  const classes = {
    [ProductStatus.public]:
      "inline-flex items-center gap-1.5 rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 hover:bg-emerald-50",
    [ProductStatus.private]:
      "inline-flex items-center gap-1.5 rounded-full border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-700 hover:bg-amber-50",
  };

  return classes[status];
};
