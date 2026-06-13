"use client";
import { SkeletonText } from "@/components/Skeleton";
import { useGetCourseByIdQuery } from "@/redux/api/courseApi";
import { useGetCompletedLessonsQuery } from "@/redux/api/lessonApi";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ReactNode, Suspense, use } from "react";
import CoursePageClient, { CoursePageSkeleton } from "./_client";
import { mapCourse } from "./courseMapper";

export default function CoursePageLayout({
  params,
  children,
}: {
  params: Promise<{ courseId: string }>;
  children: ReactNode;
}) {
  const { courseId } = use(params);
  const { lessonId } = useParams<{ lessonId?: string }>();
  const { data: course, isLoading } = useGetCourseByIdQuery(courseId);

  if (isLoading) {
    return (
      <div className="page-shell">
        <SkeletonText className="mb-6 h-4 w-64" />
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="surface-panel hidden p-5 lg:block">
            <CoursePageSkeleton />
          </div>
          <div>{children}</div>
        </div>
      </div>
    );
  }

  if (course.success === false) {
    return <div className="container my-5">{children}</div>;
  }

  const activeLesson = course.data.sections
    .flatMap((section: { lessons: { id: string; name: string }[] }) =>
      section.lessons,
    )
    .find((lesson: { id: string }) => lesson.id === lessonId);

  return (
    <div className="page-shell">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-2 overflow-hidden text-sm text-muted-foreground"
      >
        <Link
          href="/courses"
          className="flex shrink-0 items-center gap-1.5 hover:text-primary"
        >
          <Home className="size-4" aria-hidden="true" />
          <span>My Courses</span>
        </Link>
        <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
        {activeLesson ? (
          <>
            <Link
              href={`/courses/${courseId}`}
              className="max-w-52 truncate hover:text-primary"
            >
              {course.data.name}
            </Link>
            <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
            <span
              className="truncate font-medium text-foreground"
              aria-current="page"
            >
              {activeLesson.name}
            </span>
          </>
        ) : (
          <span
            className="truncate font-medium text-foreground"
            aria-current="page"
          >
            {course.data.name}
          </span>
        )}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:gap-8">
        <aside className="surface-panel hidden h-fit p-5 lg:sticky lg:top-24 lg:block">
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Course content
            </p>
            <h2 className="mt-1 text-lg font-semibold leading-snug">
              {course.data.name}
            </h2>
          </div>
          <div className="max-h-[calc(100vh-190px)] overflow-y-auto pr-1">
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
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
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
