"use client";
import ProductCard, {
  ProductSkeleton,
} from "@/components/features/ProductCard";
import PageHeader from "@/components/PageHeader";
import { useGetProductsQuery } from "@/redux/api/productApi";
import React from "react";

const HomePage = () => {
  const { data: products, isLoading: isFetchingData } = useGetProductsQuery({});

  if (isFetchingData) {
    return (
      <div className="container my-5">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <ProductSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (!isFetchingData && products?.success === false) {
    return (
      <div className="container my-5 py-4">
        <div className="border border-l-[5px] border-l-red-600 mb-4 px-4 py-4 rounded-r-md text-sm text-muted-foreground">
          Failed to fetch data. Try to refresh the page.
        </div>
      </div>
    );
  }

  if (
    !isFetchingData &&
    products?.success === true &&
    products?.data?.length === 0
  ) {
    return (
      <div className="container my-5 py-4">
        <PageHeader title="Course" />
        <div>There is no course offer at the moment.</div>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        {products?.data?.map(
          (product: {
            id: string;
            name: string;
            description: string;
            imageUrl: string;
            priceInDollar: number;
          }) => (
            <ProductCard key={product.id} {...product} />
          ),
        )}
      </div>
    </div>
  );
};

export default HomePage;
