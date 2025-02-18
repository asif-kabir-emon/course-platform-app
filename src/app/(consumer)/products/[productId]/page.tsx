"use client";
import { SkeletonButton } from "@/components/Skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPlural, formatPrice } from "@/lib/formatter";
import { sumArray } from "@/lib/sumArray";
import { cn } from "@/lib/utils";
import {
  useCheckUserAccessQuery,
  useGetProductByIdQuery,
} from "@/redux/api/productApi";
import { CourseLessonStatus } from "@prisma/client";
import { VideoIcon } from "lucide-react";
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
    <div className="container my-5 select-none">
      <div className="flex flex-col-reverse lg:flex-row justify-between lg:items-center gap-5 md:gap-8 lg:gap-16">
        <div className="flex flex-col items-start gap-6">
          <div className="flex flex-col gap-2">
            <div className="text-xl">
              {formatPrice(product.data?.priceInDollar)}
            </div>
            <h1 className="text-4xl font-semibold">{product.data?.name}</h1>
            <div className="text-muted-foreground">
              {formatPlural(
                coursesCount,
                {
                  singular: "course",
                  plural: "courses",
                },
                {
                  includeCount: true,
                },
              )}{" "}
              {" • "}
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
            </div>
          </div>
          <div className="text-xl">{product.data?.description}</div>
          <Suspense fallback={<SkeletonButton className="w-28 h-12" />}>
            {product.data?.id && (
              <PurchaseButton productId={product.data?.id} />
            )}
          </Suspense>
        </div>
        <div className="hidden lg:relative aspect-video max-w-lg flex-grow">
          <Image
            src={product.data?.imageUrl}
            fill
            alt={product.data?.name}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-contain rounded-xl"
          />
        </div>
        <div>
          <Image
            src={product.data?.imageUrl}
            alt={product.data?.name}
            width={400}
            height={400}
            className="object-cover rounded-lg w-full md:w-[400px]"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 lg:mt-16 items-start w-full">
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
            <Card key={courseProduct.course.id}>
              <CardHeader>
                <CardTitle>{courseProduct.course?.name}</CardTitle>
                <CardDescription>
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
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {courseProduct.course.sections.map((section) => (
                    <AccordionItem key={section.id} value={section.id}>
                      <AccordionTrigger className="flex gap-2 hover:no-underline">
                        <div className="flex flex-col flex-grow">
                          <span className="text-lg ">{section.name}</span>
                          <span className="text-muted-foreground">
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
                      <AccordionContent className="flex-col gap-8">
                        {section.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-2 text-base"
                          >
                            <VideoIcon
                              className={cn(
                                "size-4",
                                lesson.status !== CourseLessonStatus.preview &&
                                  "text-muted-foreground",
                              )}
                            />
                            {lesson.status === CourseLessonStatus.preview ? (
                              <Link
                                href={`/courses/${courseProduct.course.id}/lessons/${lesson.id}`}
                                className="underline"
                              >
                                {lesson.name}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">
                                {lesson.name}
                              </span>
                            )}
                          </div>
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
    </div>
  );
};

export default ProductPage;

const PurchaseButton = ({ productId }: { productId: string }) => {
  const { data: userAccess, isLoading } = useCheckUserAccessQuery(productId);

  if (isLoading) {
    return <SkeletonButton className="w-28 h-12" />;
  }

  if (!isLoading && userAccess?.success === false) {
    return (
      <Button className="text-lg h-auto py-1 px-4 rounded-md">
        <Link href="/sign-in">Login to purchase</Link>
      </Button>
    );
  }

  return (
    <div>
      {userAccess?.data.hasAccess ? (
        <div>You already own this product!</div>
      ) : (
        <Button className="text-lg h-auto py-1 px-6 rounded-lg" asChild>
          <Link href={`/products/${productId}/purchase`}>Get Now</Link>
        </Button>
      )}
    </div>
  );
};

const ProductDetailSkeleton = () => {
  return (
    <div className="container my-8 select-none w-full">
      <div className="flex flex-col-reverse lg:flex-row justify-between lg:items-center gap-5 md:gap-10 lg:gap-16">
        <div className="flex flex-col items-start gap-6">
          <div className="flex flex-col gap-2">
            <div className="w-24 h-6 bg-gray-300 rounded-lg animate-pulse"></div>
            <div className="w-60 h-8 bg-gray-300 rounded-lg animate-pulse"></div>
            <div className="w-40 h-4 bg-gray-300 rounded-lg animate-pulse"></div>
          </div>
          <div className="w-full md:w-96 h-4 bg-gray-300 rounded-lg animate-pulse"></div>
          <div className="w-full md:w-96 h-4 bg-gray-300 rounded-lg animate-pulse"></div>
          <div className="w-28 h-12 bg-gray-300 rounded-lg animate-pulse"></div>
        </div>
        <div className="md:relative md:aspect-video md:max-w-lg md:flex-grow">
          <div className="w-full h-40 md:h-full bg-gray-300 rounded-xl animate-pulse"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 lg:mt-16 items-start w-full">
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="w-40 h-6 bg-gray-300 rounded-lg animate-pulse"></div>
            </CardTitle>
            <CardDescription>
              <div className="flex gap-2 my-2">
                <div className="w-14 h-6 bg-gray-300 rounded-lg animate-pulse"></div>
                <div className="w-6 h-6 bg-gray-300 rounded-full animate-pulse"></div>
                <div className="w-14 h-6 bg-gray-300 rounded-lg animate-pulse"></div>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="section-1">
                <AccordionTrigger className="flex gap-2 hover:no-underline">
                  <div className="flex flex-col flex-grow gap-1">
                    <span className="w-24 h-6 bg-gray-300 rounded-lg animate-pulse"></span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="flex-col gap-8 space-y-1">
                  <div className="flex items-center gap-2 text-base">
                    <div className="w-6 h-5 bg-gray-300 rounded-lg animate-pulse"></div>
                    <div className="w-24 h-5 bg-gray-300 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-2 text-base">
                    <div className="w-6 h-5 bg-gray-300 rounded-lg animate-pulse"></div>
                    <div className="w-24 h-5 bg-gray-300 rounded-lg animate-pulse"></div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="section-2">
                <AccordionTrigger className="flex gap-2 hover:no-underline">
                  <div className="flex flex-col flex-grow gap-1">
                    <span className="w-24 h-6 bg-gray-300 rounded-lg animate-pulse"></span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="flex-col gap-8 space-y-1">
                  <div className="flex items-center gap-2 text-base">
                    <div className="w-6 h-5 bg-gray-300 rounded-lg animate-pulse"></div>
                    <div className="w-24 h-5 bg-gray-300 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-2 text-base">
                    <div className="w-6 h-5 bg-gray-300 rounded-lg animate-pulse"></div>
                    <div className="w-24 h-5 bg-gray-300 rounded-lg animate-pulse"></div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
