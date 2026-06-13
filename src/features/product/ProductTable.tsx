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
import React, { useState } from "react";
import {
  Archive,
  Copy,
  Ellipsis,
  EyeIcon,
  LockIcon,
  Pencil,
  RotateCcw,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ProductStatus } from "@/constants/ProductStatus.constant";
import {
  useGetProductsQuery,
  useUpdateProductActionMutation,
} from "@/redux/api/productApi";
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

const ProductTable = () => {
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [visibility, setVisibility] = useState("active");
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
      <form
        className="surface-panel grid gap-3 p-4 sm:grid-cols-[minmax(220px,1fr)_180px_180px_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setSearch(searchInput.trim());
        }}
      >
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search products..."
          aria-label="Search products"
        />
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="h-10 rounded-lg border bg-background px-3 text-sm"
          aria-label="Filter products by status"
        >
          <option value="all">All statuses</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <select
          value={visibility}
          onChange={(event) => {
            setVisibility(event.target.value);
            setPage(1);
          }}
          className="h-10 rounded-lg border bg-background px-3 text-sm"
          aria-label="Filter active or archived products"
        >
          <option value="active">Active products</option>
          <option value="archived">Archived products</option>
          <option value="all">All products</option>
        </select>
        <Button type="submit">Search</Button>
      </form>
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
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products?.data?.map(
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
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={isUpdatingProduct}
                        aria-label={`Open actions for ${product.name}`}
                        className="rounded-full"
                      >
                        <Ellipsis />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuLabel>Product actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/products/${product.id}`}>
                          <Store />
                          View storefront
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Pencil />
                          Manage product
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
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
                        {product.isDeleted ? <RotateCcw /> : <Archive />}
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
