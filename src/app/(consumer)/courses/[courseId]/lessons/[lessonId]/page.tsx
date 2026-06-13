"use client";
import { SkeletonButton, SkeletonText } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import YoutubeVideoPlayer from "@/components/YoutubeVideoPlayer";
import {
  useAddCompletedLessonMutation,
  useGetLessonByIdQuery,
  useGetNextLessonQuery,
  useGetPreviousLessonQuery,
} from "@/redux/api/lessonApi";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  LockIcon,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";
import React, { ReactNode, Suspense, use } from "react";
import { toast } from "sonner";

const LessonPage = ({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) => {
  const { courseId, lessonId } = use(params);

  const { data: lesson, isLoading } = useGetLessonByIdQuery({
    courseId,
    lessonId,
  });

  if (isLoading) {
    return <LessonSkeleton />;
  }

  if (lesson.success === false) {
    return (
      <div className="surface-panel flex min-h-80 w-full flex-col items-center justify-center px-5 py-12 text-center text-muted-foreground">
        <LockIcon className="size-16" />
        <h1 className="mt-4 text-xl font-semibold text-foreground">
          This lesson is locked
        </h1>
        <p className="mt-1 text-sm">You do not have access to this lesson.</p>
      </div>
    );
  }

  return (
    <div>
      <Suspense fallback={<LessonSkeleton />}>
        <SuspenseBoundary
          lesson={lesson.data}
          isFetchingLessonData={isLoading}
          courseId={courseId}
        />
      </Suspense>
    </div>
  );
};

export default LessonPage;

const SuspenseBoundary = ({
  lesson,
  isFetchingLessonData,
  courseId,
}: {
  lesson: {
    id: string;
    name: string;
    youtubeVideoId: string;
    sectionId: string;
    order: number;
    description: string;
    isCompleted: boolean;
    hasAccess: boolean;
  };
  isFetchingLessonData: boolean;
  courseId: string;
}) => {
  const [addCompletedLesson, { isLoading: isMarkingCompletedLesson }] =
    useAddCompletedLessonMutation();

  const { data: previousLesson, isLoading: isFetchingPreviousLessonId } =
    useGetPreviousLessonQuery({
      lessonId: lesson.id,
      order: lesson.order,
      courseId: courseId,
      sectionId: lesson.sectionId,
    });
  const { data: nextLesson, isLoading: isFetchingNextLessonId } =
    useGetNextLessonQuery({
      lessonId: lesson.id,
      order: lesson.order,
      courseId: courseId,
      sectionId: lesson.sectionId,
    });

  const handleMarkLessonAsComplete = async (lessonId: string) => {
    try {
      const response = await addCompletedLesson(lessonId).unwrap();

      if (response.success) {
        toast.success(response.message, {
          position: "top-center",
          duration: 5000,
        });
      } else {
        toast.error(response.message, {
          position: "top-center",
          duration: 5000,
        });
      }
    } catch {
      toast.error("Failed to mark lesson as completed!", {
        position: "top-center",
        duration: 5000,
      });
    }
  };

  return (
    <div className="space-y-5">
      {lesson.hasAccess && (
        <div className="lg:hidden">
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <Link href={`/courses/${courseId}`}>
              <ChevronLeft className="size-6" />
              Course content
            </Link>
          </Button>
        </div>
      )}
      <section className="surface-panel overflow-hidden">
        <div className="aspect-video bg-black">
          <YoutubeVideoPlayer
            videoId={lesson.youtubeVideoId}
            onFinishedVideo={undefined}
          />
        </div>
        {lesson.hasAccess && (
          <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
            <Suspense fallback={<SkeletonButton />}>
              <div>
                {lesson.isCompleted ? (
                  <Button
                    variant="outline"
                    disabled
                    className="w-full border-emerald-500/30 bg-emerald-500/5 text-emerald-700 disabled:opacity-100 sm:w-auto"
                  >
                    <CheckCircle2 />
                    <span>Lesson completed</span>
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleMarkLessonAsComplete(lesson.id)}
                    disabled={
                      isMarkingCompletedLesson || isFetchingLessonData
                    }
                    className="w-full sm:w-auto"
                  >
                    <CheckCircle2 />
                    <span>Mark as complete</span>
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                {!isFetchingPreviousLessonId &&
                previousLesson?.success === true ? (
                  <ToLessonButton
                    courseId={courseId}
                    lessonId={previousLesson.data.previousLessonId}
                    isDisabled={isFetchingLessonData}
                  >
                    <ArrowLeft />
                    Previous
                  </ToLessonButton>
                ) : (
                  <Button variant="outline" disabled>
                    <ArrowLeft />
                    Previous
                  </Button>
                )}
                {!isFetchingNextLessonId && nextLesson?.success === true ? (
                  <ToLessonButton
                    courseId={courseId}
                    lessonId={nextLesson.data.nextLessonId}
                    isDisabled={isFetchingLessonData}
                  >
                    Next
                    <ArrowRight />
                  </ToLessonButton>
                ) : (
                  <Button variant="outline" disabled>
                    Next
                    <ArrowRight />
                  </Button>
                )}
              </div>
            </Suspense>
          </div>
        )}
      </section>

      <section className="surface-panel p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
          <PlayCircle className="size-4" />
          Current lesson
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {lesson.name}
        </h1>
        <p className="mt-3 whitespace-pre-line leading-7 text-muted-foreground">
          {lesson.description}
        </p>
      </section>
    </div>
  );
};

const LessonSkeleton = () => {
  return (
    <div className="space-y-5">
      <div className="surface-panel overflow-hidden">
        <SkeletonText className="aspect-video w-full rounded-none" />
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:justify-between">
          <SkeletonButton />
          <div className="flex gap-2">
            <SkeletonButton />
            <SkeletonButton />
          </div>
        </div>
      </div>
      <div className="surface-panel space-y-3 p-6">
        <SkeletonText className="h-5 w-28" />
        <SkeletonText className="h-8 w-2/3" />
        <SkeletonText className="w-full" />
        <SkeletonText className="w-full" />
        <SkeletonText className="w-1/2" />
      </div>
    </div>
  );
};

const ToLessonButton = ({
  children,
  courseId,
  lessonId,
  isDisabled = false,
}: {
  children: ReactNode;
  courseId: string;
  lessonId: string;
  isDisabled?: boolean;
}) => {
  return (
    <Button
      variant="outline"
      className="w-full sm:w-auto"
      disabled={isDisabled}
      asChild
    >
      <Link href={`/courses/${courseId}/lessons/${lessonId}`}>{children}</Link>
    </Button>
  );
};
