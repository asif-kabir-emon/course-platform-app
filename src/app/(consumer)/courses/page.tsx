"use client";
import PageHeader from "@/components/PageHeader";
import { SkeletonButton, SkeletonText } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPlural } from "@/lib/formatter";
import { useGetMyCoursesQuery } from "@/redux/api/courseApi";
import Link from "next/link";
import React, { Suspense } from "react";

const CoursesPage = () => {
  return (
    <div className="container my-5 select-none">
      <PageHeader title="My Courses" />
      <Suspense fallback={<CourseSkeleton />}>
        <CourseGrid />
      </Suspense>
    </div>
  );
};

export default CoursesPage;

const CourseGrid = () => {
  const { data: courses, isLoading } = useGetMyCoursesQuery({});

  if (isLoading) {
    return <CourseSkeleton />;
  }

  if (courses.success === false) {
    return (
      <div className="border border-l-[5px] border-l-red-600 mb-4 px-4 py-4 rounded-r-md text-sm text-muted-foreground">
        Failed to fetch data. Try to refresh the page.
      </div>
    );
  }

  if (courses.data.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2">
        <div>You have no courses yet.</div>
        <Button size="lg" asChild>
          <Link href="/">Browse Courses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {courses.data.map(
        (course: {
          id: string;
          name: string;
          description: string;
          sectionsCount: number;
          lessonsCount: number;
          lessonsComplete: number;
        }) => (
          <Card key={course.id} className="overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle>{course.name}</CardTitle>
              <CardDescription>
                {formatPlural(
                  course.sectionsCount,
                  {
                    singular: "section",
                    plural: "sections",
                  },
                  {
                    includeCount: true,
                  },
                )}
                {" • "}{" "}
                {formatPlural(
                  course.lessonsCount,
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
            <CardContent className="line-clamp-3">
              {course.description}
            </CardContent>
            <div className="flex-grow" />
            <CardFooter>
              <Button asChild>
                <Link href={`/courses/${course.id}`}>View Course</Link>
              </Button>
            </CardFooter>
            <div
              className="bg-accent h-2 -mt-2"
              style={{
                width: `${
                  (course.lessonsComplete / course.lessonsCount) * 100
                }%`,
              }}
            />
          </Card>
        ),
      )}
    </div>
  );
};

const CourseSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[1, 2, 3].map((_, index) => (
        <Card key={index} className="animate-pulse">
          <CardHeader>
            <CardTitle>
              <SkeletonText className="w-3/4 h-6" />
            </CardTitle>
            <CardDescription>
              <div className="flex gap-1">
                <SkeletonText className="w-12 h-5" />
                <SkeletonText className="w-5 h-5 rounded-full" />
                <SkeletonText className="w-12 h-5" />
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <SkeletonText className="h-5" />
            <SkeletonText className="h-5" />
            <SkeletonText className="h-5" />
          </CardContent>
          <div className="flex-grow" />
          <CardFooter>
            <SkeletonButton />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
