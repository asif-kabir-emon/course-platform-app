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
    <Card className="group overflow-hidden flex flex-col w-full max-w-[500px] mx-auto hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10">
      <div className="relative aspect-video w-full">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/25 to-transparent" />
      </div>
      <CardHeader className="space-y-0">
        <CardDescription>
          <div className="mb-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            {formatPrice(priceInDollar)}
          </div>
        </CardDescription>
        <CardTitle className="text-xl">{name}</CardTitle>
      </CardHeader>
      <CardContent className="mt-auto">
        <p className="line-clamp-3 text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button className="w-full py-6 text-base" asChild>
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
        <div className="bg-secondary animate-pulse w-full h-60" />
      </div>
      <CardHeader className="space-y-0">
        <CardDescription>
          <div className="mb-2 text-base bg-secondary animate-pulse h-6 w-20 rounded-full" />
        </CardDescription>
        <CardTitle className="text-xl bg-secondary animate-pulse h-6 w-40 rounded" />
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 bg-secondary animate-pulse h-6 w-full rounded" />
      </CardContent>
      <CardFooter className="mt-auto">
        <Button className="w-full text-md py-6 bg-secondary animate-pulse" />
      </CardFooter>
    </Card>
  );
};
