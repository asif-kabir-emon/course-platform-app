"use client";
import ProductCard from "@/components/features/ProductCard";
import { useGetProductsQuery } from "@/redux/api/productApi";
import React from "react";

const HomePage = () => {
  const { data: products, isLoading: isFetchingData } = useGetProductsQuery({});

  if (isFetchingData) {
    return <div>Loading...</div>;
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
