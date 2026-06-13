"use client";
import { SkeletonButton, SkeletonText } from "@/components/Skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CourseLessonStatus } from "@/constants/CourseLessonStatus.constant";
import { formatPlural, formatPrice } from "@/lib/formatter";
import { sumArray } from "@/lib/sumArray";
import { cn } from "@/lib/utils";
import {
  useCheckUserAccessQuery,
  useGetProductByIdQuery,
} from "@/redux/api/productApi";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Home,
  LockKeyhole,
  PlayCircle,
  ShoppingBag,
  VideoIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import React, { Suspense, use } from "react";

const ProductPage = ({
  params,
}: {
  params: Promise<{ productId: string }>;
}) => {
  const { productId } = use(params);
  const { data: product, isLoading } = useGetProductByIdQuery(productId);

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (product.success === false) {
    return notFound();
  }

  const coursesCount = product.data?.courseProducts.length;
  const lessonsCount = sumArray(
    product.data?.courseProducts ?? [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (course: any) =>
      sumArray(
        course.course?.sections ?? [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (s: any) => s.lessons?.length ?? 0,
      ),
  );

  return (
    <div className="page-shell select-none">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-2 overflow-hidden text-sm text-muted-foreground"
      >
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1.5 hover:text-primary"
        >
          <Home className="size-4" aria-hidden="true" />
          <span>Home</span>
        </Link>
        <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
        <span
          className="truncate font-medium text-foreground"
          aria-current="page"
        >
          {product.data?.name}
        </span>
      </nav>

      <section className="surface-panel overflow-hidden">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,44%)]">
          <div className="order-2 flex flex-col justify-center p-5 sm:p-8 lg:order-1 lg:p-10">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Learning bundle</Badge>
              <Badge
                variant="outline"
                className="border-primary/20 bg-background/70 text-primary"
              >
                {formatPrice(product.data?.priceInDollar)}
              </Badge>
            </div>
            <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {product.data?.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {product.data?.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <span className="flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5">
                <BookOpen className="size-4 text-primary" />
                {formatPlural(
                  coursesCount,
                  {
                    singular: "course",
                    plural: "courses",
                  },
                  {
                    includeCount: true,
                  },
                )}
              </span>
              <span className="flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5">
                <PlayCircle className="size-4 text-primary" />
                {formatPlural(
                  lessonsCount,
                  {
                    singular: "lesson",
                    plural: "lessons",
                  },
                  {
                    includeCount: true,
                  },
                )}
              </span>
              <span className="flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5">
                <Clock3 className="size-4 text-primary" />
                Learn at your pace
              </span>
            </div>
            <div className="mt-7">
              <Suspense fallback={<SkeletonButton className="h-11 w-36" />}>
                {product.data?.id && (
                  <PurchaseButton productId={product.data.id} />
                )}
              </Suspense>
            </div>
          </div>
          <div className="relative order-1 aspect-video min-h-56 bg-muted lg:order-2 lg:aspect-auto">
            <Image
              src={product.data?.imageUrl}
              fill
              priority
              alt={product.data?.name}
              sizes="(min-width: 1024px) 44vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/15 to-transparent" />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-5">
          <h2 className="text-2xl font-bold tracking-tight">What you’ll learn</h2>
          <p className="mt-1 text-muted-foreground">
            Explore every course, section, and lesson included in this bundle.
          </p>
        </div>
        <div
          className={cn(
            "grid items-start gap-6",
            (product.data?.courseProducts.length ?? 0) > 1 &&
              "xl:grid-cols-2",
          )}
        >
          {product.data?.courseProducts.map(
            (courseProduct: {
              course: {
                id: string;
                name: string;
                sections: {
                  id: string;
                  name: string;
                  lessons: {
                    id: string;
                    name: string;
                    status: CourseLessonStatus;
                  }[];
                }[];
              };
            }) => (
              <Card
                key={courseProduct.course.id}
                className="overflow-hidden border-border/80"
              >
                <CardHeader className="border-b bg-muted/30 p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <BookOpen className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold leading-snug">
                        {courseProduct.course?.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatPlural(
                          courseProduct.course.sections.length,
                          {
                            singular: "section",
                            plural: "sections",
                          },
                          {
                            includeCount: true,
                          },
                        )}
                        {" • "}
                        {formatPlural(
                          sumArray(
                            courseProduct.course.sections,
                            (section) => section.lessons.length,
                          ) ?? 0,
                          {
                            singular: "lesson",
                            plural: "lessons",
                          },
                          {
                            includeCount: true,
                          },
                        )}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                  <Accordion type="multiple" className="w-full">
                    {courseProduct.course.sections.map((section) => (
                      <AccordionItem
                        key={section.id}
                        value={section.id}
                        className="border-border/70 last:border-b-0"
                      >
                        <AccordionTrigger className="gap-3 py-4 hover:no-underline">
                          <div className="flex min-w-0 flex-grow flex-col text-left">
                            <span className="font-semibold leading-snug">
                              {section.name}
                            </span>
                            <span className="mt-0.5 text-xs text-muted-foreground">
                              {formatPlural(
                                section.lessons.length ?? 0,
                                {
                                  singular: "lesson",
                                  plural: "lessons",
                                },
                                {
                                  includeCount: true,
                                },
                              )}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-2 pb-4">
                          {section.lessons.map((lesson) => (
                            <LessonRow
                              key={lesson.id}
                              lesson={lesson}
                              courseId={courseProduct.course.id}
                            />
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </section>
    </div>
  );
};

export default ProductPage;

const LessonRow = ({
  lesson,
  courseId,
}: {
  lesson: {
    id: string;
    name: string;
    status: CourseLessonStatus;
  };
  courseId: string;
}) => {
  const isPreview = lesson.status === CourseLessonStatus.preview;
  const content = (
    <>
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          isPreview
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground",
        )}
      >
        {isPreview ? (
          <VideoIcon className="size-4" />
        ) : (
          <LockKeyhole className="size-4" />
        )}
      </div>
      <span className="min-w-0 flex-1 leading-snug">{lesson.name}</span>
      {isPreview && (
        <Badge variant="secondary" className="shrink-0">
          Preview
        </Badge>
      )}
    </>
  );

  if (isPreview) {
    return (
      <Link
        href={`/courses/${courseId}/lessons/${lesson.id}`}
        className="flex items-center gap-3 rounded-xl bg-primary/5 px-3 py-2.5 text-sm font-medium hover:bg-primary/10 hover:text-primary"
        target="_blank"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
      {content}
    </div>
  );
};

const PurchaseButton = ({ productId }: { productId: string }) => {
  const { data: userAccess, isLoading } = useCheckUserAccessQuery(productId);

  if (isLoading) {
    return <SkeletonButton className="w-28 h-12" />;
  }

  if (!isLoading && userAccess?.success === false) {
    return (
      <Button size="lg" asChild>
        <Link href="/sign-in">Login to purchase</Link>
      </Button>
    );
  }

  return (
    <>
      {userAccess?.data.hasAccess ? (
        <div className="flex w-fit items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="size-5" />
          You already own this product
        </div>
      ) : (
        <Button size="lg" asChild>
          <Link href={`/products/${productId}/purchase`} target="_blank">
            <ShoppingBag />
            Get this bundle
          </Link>
        </Button>
      )}
    </>
  );
};

const ProductDetailSkeleton = () => {
  return (
    <div className="page-shell w-full select-none">
      <SkeletonText className="mb-6 h-4 w-48" />
      <div className="surface-panel grid overflow-hidden lg:grid-cols-2">
        <div className="space-y-4 p-6 sm:p-10">
          <SkeletonText className="h-6 w-32" />
          <SkeletonText className="h-10 w-2/3" />
          <div className="space-y-2">
            <SkeletonText className="h-4 w-full" />
            <SkeletonText className="h-4 w-3/4" />
          </div>
          <div className="flex gap-3">
            <SkeletonText className="h-8 w-24 rounded-full" />
            <SkeletonText className="h-8 w-24 rounded-full" />
          </div>
          <SkeletonButton className="h-11 w-36" />
        </div>
        <SkeletonText className="aspect-video h-full w-full rounded-none" />
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="space-y-2 border-b">
            <SkeletonText className="h-6 w-48" />
            <SkeletonText className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-2 border-b pb-4">
                <SkeletonText className="h-5 w-2/3" />
                <SkeletonText className="h-3 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
