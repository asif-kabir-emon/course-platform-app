"use client";
import PageHeader from "@/components/PageHeader";
import React, { use } from "react";
import { useGetProductByIdQuery } from "@/hooks/product.hook";
import ProductForm from "@/features/product/ProductForm";
import { FormPageSkeleton } from "@/components/Skeleton";

const ProductEditPage = ({
  params,
}: {
  params: Promise<{ productId: string }>;
}) => {
  const { productId } = use(params);
  const { data: products, isLoading: isDataFetching } =
    useGetProductByIdQuery(productId);

  if (isDataFetching) {
    return <FormPageSkeleton fields={6} />;
  }

  return (
    <div className="container my-5">
      <PageHeader title={products.data.name} />

      <ProductForm product={products.data} />
    </div>
  );
};

export default ProductEditPage;
