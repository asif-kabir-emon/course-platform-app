"use client";
import { SkeletonText } from "@/components/Skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGetCourseByIdQuery } from "@/redux/api/courseApi";
import { useGetCompletedLessonsQuery } from "@/redux/api/lessonApi";
import { BookOpen, CheckCircle2, Circle, PlayCircle } from "lucide-react";
import Link from "next/link";
import React, { use } from "react";
import { mapCourse } from "./courseMapper";

const CoursePage = ({ params }: { params: Promise<{ courseId: string }> }) => {
  const { courseId } = use(params);
  const { data: course, isLoading: isFetchingCourseData } =
    useGetCourseByIdQuery(courseId);
  const { data: completedLessons, isLoading: isFetchingCompletedLessonData } =
    useGetCompletedLessonsQuery({});

  if (isFetchingCourseData || isFetchingCompletedLessonData) {
    return <ProductSkeleton />;
  }

  if (course.success === false) {
    return (
      <div className="container my-5">
        <div className="border border-l-[5px] border-l-red-600 mb-4 px-4 py-4 rounded-r-md text-sm text-muted-foreground">
          Failed to fetch data. Try to refresh the page.
          <div className="text-red-500">Error: {course.message}</div>
        </div>
      </div>
    );
  }

  const mappedCourse = mapCourse({
    course: course.data,
    completedLessonIds: completedLessons.data,
  });
  const lessonCount = mappedCourse.sections.reduce(
    (total, section) => total + section.lessons.length,
    0,
  );
  const completedCount = mappedCourse.sections.reduce(
    (total, section) =>
      total + section.lessons.filter((lesson) => lesson.isComplete).length,
    0,
  );

  return (
    <div className="space-y-6">
      <section className="surface-panel overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5 sm:p-7">
          <Badge variant="secondary" className="mb-3">
            Course overview
          </Badge>
          <h1 className="max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
            {course.data.name}
          </h1>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
            {course.data.description}
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5">
              <BookOpen className="size-4 text-primary" />
              {mappedCourse.sections.length} sections
            </span>
            <span className="flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5">
              <PlayCircle className="size-4 text-primary" />
              {lessonCount} lessons
            </span>
            <span className="flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5">
              <CheckCircle2 className="size-4 text-emerald-600" />
              {completedCount} completed
            </span>
          </div>
        </div>
      </section>

      <div>
        <h2 className="text-xl font-semibold">Course curriculum</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a lesson to continue learning.
        </p>
      </div>
      <CourseDetailWithSessionLesson course={mappedCourse} />
    </div>
  );
};

export default CoursePage;

const CourseDetailWithSessionLesson = ({
  course,
}: {
  course: {
    id: string;
    name: string;
    sections: {
      id: string;
      name: string;
      lessons: {
        id: string;
        name: string;
        isComplete: boolean;
      }[];
    }[];
  };
}) => {
  return (
    <div className="space-y-4">
      {course.sections.map(
        (sections: {
          id: string;
          name: string;
          lessons: {
            id: string;
            name: string;
            isComplete: boolean;
          }[];
        }) => (
          <section key={sections.id} className="surface-panel p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-semibold">{sections.name}</h3>
              <Badge variant="secondary">
                {sections.lessons.length} lessons
              </Badge>
            </div>
            <div className="space-y-2">
              {sections.lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/courses/${course.id}/lessons/${lesson.id}`}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border border-transparent bg-muted/50 px-3 py-3 hover:border-primary/15 hover:bg-primary/5",
                    lesson.isComplete && "bg-emerald-500/5",
                  )}
                >
                  {lesson.isComplete ? (
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="size-5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="min-w-0 flex-1 font-medium group-hover:text-primary">
                    {lesson.name}
                  </span>
                  <PlayCircle className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </section>
        ),
      )}
    </div>
  );
};

const ProductSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="surface-panel space-y-3 p-6">
        <SkeletonText className="h-6 w-32" />
        <SkeletonText className="h-8 w-2/3" />
        <SkeletonText className="h-4 w-full" />
        <SkeletonText className="h-4 w-1/2" />
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="surface-panel w-full p-4" key={index}>
            <div className="flex-1 space-y-2 py-1">
              <SkeletonText className="h-5 w-40" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div className="flex items-center gap-3" key={index}>
                    <SkeletonText className="size-5 rounded-full" />
                    <SkeletonText className="h-4 w-48" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
