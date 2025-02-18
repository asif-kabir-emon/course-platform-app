"use client";
import PageHeader from "@/components/PageHeader";
import { useGetCourseByIdQuery } from "@/redux/api/courseApi";
import { useGetCompletedLessonsQuery } from "@/redux/api/lessonApi";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import React, { use } from "react";
import { mapCourse } from "./layout";
import { cn } from "@/lib/utils";
import { SkeletonText } from "@/components/Skeleton";

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

  return (
    <div className="container my-5 w-full">
      <PageHeader title={course.data.name} className="mb-2" />
      <p className="text-muted-foreground">{course.data.description}</p>
      <CourseDetailWithSessionLesson
        course={mapCourse({
          course: course.data,
          completedLessonIds: completedLessons.data,
        })}
      />
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
    <div className="space-y-3 my-5">
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
          <div key={sections.id} className="rounded-lg bg-slate-100 p-4">
            <h2 className="text-lg font-semibold mb-1.5">{sections.name}</h2>
            <div>
              {sections.lessons.map((lesson) => (
                <div key={lesson.id} className="space-y-3">
                  <Link
                    href={`/courses/${course.id}/lessons/${lesson.id}`}
                    className={cn(
                      "flex items-center gap-2 hover:underline my-1",
                      lesson.isComplete && "text-green-700",
                    )}
                  >
                    <CheckCircle size={16} />
                    <div>{lesson.name}</div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ),
      )}
    </div>
  );
};

const ProductSkeleton = () => {
  return (
    <div className="container my-5 space-y-2">
      <SkeletonText className="rounded-lg bg-slate-200 h-7 w-1/2 mb-1.5" />
      <div className="space-y-2 pb-3">
        <SkeletonText className="rounded-lg bg-slate-200 h-2 w-full" />
        <SkeletonText className="rounded-lg bg-slate-200 h-2 w-1/2" />
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="rounded-lg bg-slate-100 p-4 w-full" key={index}>
            <div className="flex-1 space-y-2 py-1">
              <SkeletonText className="h-4 bg-slate-200 rounded w-40" />
              <div className="space-y-[1px]">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div className="flex items-center gap-2" key={index}>
                    <CheckCircle
                      size={16}
                      className="animate-pulse text-slate-200 font-semibold"
                    />
                    <SkeletonText className="h-2 bg-slate-200 rounded w-28" />
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
