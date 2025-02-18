import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
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
import { ProductStatus } from "@prisma/client";
import {
  useDeleteProductMutation,
  useGetProductsQuery,
} from "@/redux/api/productApi";

const ProductTable = () => {
  const { data: products, isLoading: isFetchingData } = useGetProductsQuery({
    showAllProducts: true,
  });
  const [deleteProduct, { isLoading: isDeletingProduct }] =
    useDeleteProductMutation();

  if (isFetchingData) {
    return <div>Loading...</div>;
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
    <div>
      <Table>
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
                  <Badge className="inline-flex items-center gap-2">
                    {getStatusIcon(product.status)}
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button>
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
                        className="border-red-500 hover:bg-red-500 text-red-500"
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

  return <Icon size={16} />;
};
