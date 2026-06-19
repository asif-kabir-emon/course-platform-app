"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ProductCard, { ProductSkeleton } from "@/features/product/ProductCard";
import { useGetProductsQuery } from "@/hooks/product.hook";
import { formatPrice } from "@/lib/formatter";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Library,
  MonitorPlay,
  Sparkles,
} from "lucide-react";
import React, { useMemo } from "react";

type HomeProduct = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  priceInDollar: number;
};

const HomePage = () => {
  const { data: products, isLoading: isFetchingData } = useGetProductsQuery({});
  const productList = useMemo(
    () => (products?.success ? (products.data as HomeProduct[]) : []),
    [products],
  );
  const featuredProduct = productList[0];
  const lowestPrice = productList.length
    ? Math.min(...productList.map((product) => product.priceInDollar))
    : 0;

  if (isFetchingData) {
    return (
      <div className="page-shell space-y-6">
        <div className="skeleton-shimmer h-64 rounded-2xl" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
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
      <div className="page-shell">
        <div className="surface-panel p-10 text-center">
          <GraduationCap className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Courses are coming soon</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            New learning paths are being prepared. Please check back shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell select-none space-y-10">
      <section
        className="relative overflow-hidden rounded-2xl border bg-foreground text-background shadow-xl shadow-primary/10"
        style={
          featuredProduct
            ? {
                backgroundImage: `linear-gradient(90deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.74), rgba(15, 23, 42, 0.2)), url(${featuredProduct.imageUrl})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }
            : undefined
        }
      >
        <div className="grid min-h-[30rem] gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end lg:p-10">
          <div className="flex max-w-3xl flex-col justify-center self-center">
            <Badge className="mb-5 w-fit border-white/20 bg-white/15 text-white hover:bg-white/15">
              Online learning made simple
            </Badge>
            <h1 className="max-w-3xl text-4xl font-bold tracking-normal text-white sm:text-5xl">
              Learn new skills with courses that are easy to start and simple to
              follow.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
              KnowVeria brings courses, lessons, and learning progress into one
              clean place, so learners can explore what interests them and keep
              moving at their own pace.
            </p>
            <div className="mt-7 grid gap-3 sm:flex sm:items-center">
              <Button size="lg" asChild>
                <a href="#courses">
                  Explore courses
                  <ArrowRight className="size-4" />
                </a>
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-white/15 bg-white/10 p-4 text-white shadow-2xl backdrop-blur">
            <p className="text-sm font-semibold text-white/75">
              Why learners choose KnowVeria
            </p>
            <div className="mt-4 space-y-3">
              {[
                {
                  icon: MonitorPlay,
                  title: "Video-first learning",
                  body: "Watch lessons and move through each course step by step.",
                },
                {
                  icon: Clock3,
                  title: "Self-paced access",
                  body: "Study when your schedule makes room for it.",
                },
                {
                  icon: CheckCircle2,
                  title: "Progress-friendly layout",
                  body: "Return to your course and continue with less friction.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="flex gap-3 rounded-lg bg-white/10 p-3"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="mt-1 text-sm text-white/70">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            icon: Library,
            title: "Built for different learning goals",
            body: "Browse the available catalog and choose what fits your next step.",
          },
          {
            icon: BookOpen,
            title: `${productList.length} active courses`,
            body: "Start with any course that matches your interest or plan.",
          },
          {
            icon: Sparkles,
            title:
              lowestPrice > 0
                ? `Courses from ${formatPrice(lowestPrice)}`
                : "Simple course access",
            body: "Preview the offer, choose a course, and begin learning.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="surface-panel p-5">
            <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
              <Icon className="size-5" />
            </span>
            <h3 className="mt-4 font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {body}
            </p>
          </div>
        ))}
      </div>

      <div id="courses" className="scroll-mt-24">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-normal">
              Available courses
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose the course that fits what you want to learn next.
            </p>
          </div>
          <Badge variant="secondary" className="w-fit">
            {productList.length} courses
          </Badge>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
          {productList.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
