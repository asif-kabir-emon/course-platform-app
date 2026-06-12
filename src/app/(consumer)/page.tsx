"use client";
import PageHeader from "@/components/PageHeader";
import ProductCard, { ProductSkeleton } from "@/features/product/ProductCard";
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
    <div className="page-shell select-none">
      <section className="mb-8 overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary via-primary/90 to-accent p-6 text-primary-foreground shadow-xl shadow-primary/10 sm:p-10">
        <div className="max-w-2xl">
          <span className="mb-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            Learn at your pace
          </span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Build practical skills with courses designed for progress.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-primary-foreground/80 sm:text-base">
            Explore available courses, learn lesson by lesson, and keep your
            progress in one place.
          </p>
        </div>
      </section>
      <div className="mb-5">
        <h2 className="text-2xl font-bold tracking-tight">Available courses</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a course and start learning today.
        </p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
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
