"use client";
import { Button } from "@/components/ui/button";
import { useGetProductByIdQuery } from "@/redux/api/productApi";
import Image from "next/image";
import Link from "next/link";
import { use } from "react";

const ProductPurchaseSuccessPage = ({
  params,
}: {
  params: Promise<{ productId: string }>;
}) => {
  const { productId } = use(params);
  const { data: product, isLoading: isFetchingData } =
    useGetProductByIdQuery(productId);

  if (isFetchingData) {
    return <div>Loading...</div>;
  }

  if (!product.success) {
    return <div>Failed</div>;
  }

  return (
    <div className="container my-5">
      <div className="flex flex-col justify-center gap-6">
        <div className="max-w-lg mx-auto">
          <Image
            src={product.data.imageUrl}
            alt={product.data.name}
            width="500"
            height="500"
            className="rounded-xl"
          />
        </div>
        <div className="flex flex-col gap-4 items-center">
          <div className="text-3xl font-semibold">Purchase Successful</div>
          <div className="text-xl">
            Thank you for purchasing {product.data.name}.
          </div>
          <Button asChild className="text-xl h-auto py-4 px-8 rounded-lg">
            <Link href="/courses">View My Courses</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductPurchaseSuccessPage;
