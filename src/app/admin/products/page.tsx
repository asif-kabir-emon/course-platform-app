"use client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import ProductTable from "@/features/ProductTable";
import Link from "next/link";
import React from "react";

const ProductPage = () => {
  return (
    <div className="container my-5">
      <PageHeader title="Products">
        <Button asChild>
          <Link href="/admin/products/add">Add Product</Link>
        </Button>
      </PageHeader>
      <ProductTable />
    </div>
  );
};

export default ProductPage;
