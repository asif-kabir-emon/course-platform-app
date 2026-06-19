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
import { ArrowRight, BookOpen, Layers3 } from "lucide-react";

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
    <Card className="group flex w-full flex-col overflow-hidden border-border/80 transition-all duration-200 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10">
      <div className="relative aspect-video w-full">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/25 to-transparent" />
        <div className="absolute left-3 top-3 rounded-full bg-background/95 px-3 py-1 text-sm font-bold text-primary shadow-sm">
          {formatPrice(priceInDollar)}
        </div>
      </div>
      <CardHeader className="pb-3">
        <CardDescription className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-primary">
          <Layers3 className="size-4" />
          Online course
        </CardDescription>
        <CardTitle className="line-clamp-2 text-xl">{name}</CardTitle>
      </CardHeader>
      <CardContent className="mt-auto">
        <p className="line-clamp-3 text-muted-foreground">{description}</p>
        <div className="mt-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <BookOpen className="size-4 text-accent" />
          Lesson-based course
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button className="w-full py-6 text-base" asChild>
          <Link href={`/products/${id}`}>
            View course
            <ArrowRight className="size-4" />
          </Link>
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
        <div className="skeleton-shimmer h-60 w-full" />
      </div>
      <CardHeader className="space-y-0">
        <CardDescription>
          <div className="skeleton-shimmer mb-2 h-6 w-20 rounded-full" />
        </CardDescription>
        <CardTitle className="skeleton-shimmer h-6 w-40 rounded" />
      </CardHeader>
      <CardContent>
        <p className="skeleton-shimmer h-6 w-full rounded" />
      </CardContent>
      <CardFooter className="mt-auto">
        <div className="skeleton-shimmer h-12 w-full rounded-lg" />
      </CardFooter>
    </Card>
  );
};
