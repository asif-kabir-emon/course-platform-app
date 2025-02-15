"use client";
import { useGetCourseByIdQuery } from "@/redux/api/courseApi";
import { useGetCompletedLessonsQuery } from "@/redux/api/lessonApi";
import { ReactNode, Suspense, use } from "react";
import CoursePageClient, { CoursePageSkeleton } from "./_client";
import { LockIcon } from "lucide-react";

export default function CoursePageLayout({
  params,
  children,
}: {
  params: Promise<{ courseId: string }>;
  children: ReactNode;
}) {
  const { courseId } = use(params);
  const { data: course, isLoading } = useGetCourseByIdQuery(courseId);

  if (isLoading) {
    return (
      <div className="container grid grid-cols-[300px,1fr] gap-8">
        <div className="py-4">
          <CoursePageSkeleton />
        </div>
        <div className="py-4">{children}</div>
      </div>
    );
  }

  if (course.success === false) {
    return (
      <div className="container grid grid-cols-[300px,1fr] gap-8">
        <div className="my-4 bg-secondary rounded-md flex flex-col justify-center items-center gap-1 text-red-500">
          <LockIcon className="size-12" />
          <div className="text-sm font-semibold">No access</div>
        </div>
        <div className="py-4">{children}</div>
      </div>
    );
  }

  return (
    <div className="container grid grid-cols-[300px,1fr] gap-8">
      <div className="py-4">
        <div className="text-lg font-semibold">{course.data.name}</div>
        <Suspense
          fallback={
            <CoursePageClient
              course={mapCourse({
                course: course.data,
                completedLessonIds: [],
              })}
            />
          }
        >
          <SuspenseBoundary course={course.data} />
        </Suspense>
      </div>
      <div className="py-4">{children}</div>
    </div>
  );
}

function SuspenseBoundary({
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
      }[];
    }[];
  };
}) {
  const { data: completedLessons, isLoading } = useGetCompletedLessonsQuery({});

  if (isLoading) {
    return null;
  }

  if (completedLessons.success === false) {
    return null;
  }

  return (
    <CoursePageClient
      course={mapCourse({
        course,
        completedLessonIds: completedLessons.data,
      })}
    />
  );
}

const mapCourse = ({
  course,
  completedLessonIds,
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
      }[];
    }[];
  };
  completedLessonIds: string[];
}) => {
  return {
    ...course,
    sections: course.sections.map((section) => ({
      ...section,
      lessons: section.lessons.map((lesson) => ({
        ...lesson,
        isComplete: completedLessonIds.includes(lesson.id),
      })),
    })),
  };
};
