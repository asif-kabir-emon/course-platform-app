"use client";
import ProductForm from "@/components/features/ProductForm";
import PageHeader from "@/components/PageHeader";
import React from "react";

const NewProductPage = () => {
  return (
    <div className="container my-5">
      <PageHeader title="New Product" />
      <ProductForm />
    </div>
  );
};

export default NewProductPage;
