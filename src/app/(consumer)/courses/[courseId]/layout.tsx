"use client";
import { SkeletonText } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGetCourseByIdQuery } from "@/hooks/course.hook";
import { useGetCompletedLessonsQuery } from "@/hooks/lesson.hook";
import {
  ChevronRight,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ReactNode, Suspense, use, useEffect, useState } from "react";
import CoursePageClient, { CoursePageSkeleton } from "./_client";
import { mapCourse } from "./courseMapper";

const sidebarStorageKey = "course-sidebar-collapsed";

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    setIsSidebarCollapsed(
      window.localStorage.getItem(sidebarStorageKey) === "true",
    );
  }, []);

  const setSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    window.localStorage.setItem(sidebarStorageKey, String(collapsed));
  };

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
    .flatMap(
      (section: { lessons: { id: string; name: string }[] }) => section.lessons,
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

      {isSidebarCollapsed && (
        <div className="mb-4 hidden lg:flex">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSidebarCollapsed(false)}
            aria-label="Open course content sidebar"
            aria-expanded={false}
          >
            <PanelLeftOpen />
            Course content
          </Button>
        </div>
      )}

      <div
        className={cn(
          "grid gap-6 xl:gap-8",
          !isSidebarCollapsed && "lg:grid-cols-[300px_minmax(0,1fr)]",
        )}
      >
        {!isSidebarCollapsed && (
          <aside className="surface-panel hidden h-fit p-5 lg:sticky lg:top-24 lg:block">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Course content
                </p>
                <h2 className="mt-1 text-lg font-semibold leading-snug">
                  {course.data.name}
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="-mr-2 -mt-2 size-9 shrink-0"
                onClick={() => setSidebarCollapsed(true)}
                aria-label="Collapse course content sidebar"
                aria-expanded
                title="Collapse sidebar"
              >
                <PanelLeftClose />
              </Button>
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
        )}
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
