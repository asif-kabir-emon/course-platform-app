"use client";
import PageHeader from "@/components/PageHeader";
import React, { use } from "react";
import { useGetProductByIdQuery } from "@/redux/api/productApi";
import ProductForm from "@/features/product/ProductForm";

const ProductEditPage = ({
  params,
}: {
  params: Promise<{ productId: string }>;
}) => {
  const { productId } = use(params);
  const { data: products, isLoading: isDataFetching } =
    useGetProductByIdQuery(productId);

  if (isDataFetching) {
    return <div className="container my-5">Loading...</div>;
  }

  return (
    <div className="container my-5">
      <PageHeader title={products.data.name} />

      <ProductForm product={products.data} />
    </div>
  );
};

export default ProductEditPage;
