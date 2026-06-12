import { Button } from "@/components/ui/button";
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
import React from "react";
import { EyeIcon, LockIcon, Trash2Icon } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { toast } from "sonner";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ProductStatus } from "@/constants/ProductStatus.constant";
import {
  useDeleteProductMutation,
  useGetProductsQuery,
} from "@/redux/api/productApi";
import { TableSkeleton } from "@/components/Skeleton";

const ProductTable = () => {
  const { data: products, isLoading: isFetchingData } = useGetProductsQuery({
    showAllProducts: true,
  });
  const [deleteProduct, { isLoading: isDeletingProduct }] =
    useDeleteProductMutation();

  if (isFetchingData) {
    return <TableSkeleton columns={4} withMedia />;
  }

  if (products.success === false) {
    return null;
  }

  const handleDeleteProduct = async (id: string) => {
    const toastId = toast.loading("Deleting product...", {
      duration: 2000,
      position: "top-center",
    });
    try {
      const response = await deleteProduct(id).unwrap();

      if (response.success) {
        toast.success(response.message, { id: toastId, duration: 2000 });
      } else {
        toast.error(response.message, { id: toastId, duration: 2000 });
      } // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to delete product!", { id: toastId, duration: 2000 });
    }
  };

  return (
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
                    className={getStatusClassName(product.status)}
                  >
                    {getStatusIcon(product.status)}
                    <span className="capitalize">{product.status}</span>
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button asChild>
                      <Link href={`/admin/products/${product.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                    <ActionButton
                      action={() => {
                        handleDeleteProduct(product.id);
                      }}
                      tryAction={isDeletingProduct}
                    >
                      <Button
                        variant="outline"
                        className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2Icon />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </ActionButton>
                  </div>
                </TableCell>
              </TableRow>
            ),
          )}
        </TableBody>
      </Table>
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
