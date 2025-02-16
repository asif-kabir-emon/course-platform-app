"use client";
import PageHeader from "@/components/PageHeader";
import ProductForm from "@/features/ProductForm";
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
