/* eslint-disable react-hooks/rules-of-hooks */
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
  const { data: product, isLoading: isFetchingData } =
    useGetProductByIdQuery(productId);

  if (isFetchingData) {
    return <div>Loading...</div>;
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
      <div className="flex   justify-between items-center gap-16">
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
        <div className="relative aspect-video max-w-lg flex-grow">
          <Image
            src={product.data?.imageUrl}
            fill
            alt={product.data?.name}
            className="object-contain rounded-xl"
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
  const { data: userAccess } = useCheckUserAccessQuery(productId);

  const hasAccess = userAccess?.success && userAccess?.data.hasAccess;

  return (
    <div>
      {hasAccess ? (
        <div>You already own this product!</div>
      ) : (
        <Button className="text-lg h-auto py-1 px-6 rounded-lg" asChild>
          <Link href={`/products/${productId}/purchase`}>Get Now</Link>
        </Button>
      )}
    </div>
  );
};
