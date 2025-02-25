import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { formatPrice } from "@/lib/formatter";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ProductCard = ({
  id,
  name,
  description,
  imageUrl,
  priceInDollar,
}: {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  priceInDollar: number;
}) => {
  return (
    <Card className="overflow-hidden flex flex-col w-full max-w-[500px] mx-auto">
      <div className="relative aspect-video w-full">
        <Image src={imageUrl} alt={name} fill className="object-cover" />
      </div>
      <CardHeader className="space-y-0">
        <CardDescription>
          <div className="mb-2 text-base">{formatPrice(priceInDollar)}</div>
        </CardDescription>
        <CardTitle className="text-xl">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3">{description}</p>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button className="w-full text-md py-6" asChild>
          <Link href={`/products/${id}`}>View Course</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;

export const ProductSkeleton = () => {
  return (
    <Card className="overflow-hidden flex flex-col w-full max-w-[500px] mx-auto">
      <div className="relative aspect-video w-full">
        <div className="bg-gray-200 animate-pulse w-full h-60" />
      </div>
      <CardHeader className="space-y-0">
        <CardDescription>
          <div className="mb-2 text-base bg-gray-200 animate-pulse h-6 w-20" />
        </CardDescription>
        <CardTitle className="text-xl bg-gray-200 animate-pulse h-6 w-40" />
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 bg-gray-200 animate-pulse h-6 w-full" />
      </CardContent>
      <CardFooter className="mt-auto">
        <Button className="w-full text-md py-6 bg-gray-200 animate-pulse" />
      </CardFooter>
    </Card>
  );
};
