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
import { CheckCircle, LockIcon } from "lucide-react";
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
      <div className="flex flex-col items-center justify-center my-5 py-10 md:py-20 lg:py-28 rounded-xl bg-slate-100 text-slate-500 h-full w-full">
        <LockIcon className="size-16" />
        <p className="text-sm mt-4">Unauthorized access</p>
      </div>
    );
  }

  return (
    <div className="container my-5">
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
    <div className="flex flex-col gap-4">
      <div className="aspect-video">
        <YoutubeVideoPlayer
          videoId={lesson.youtubeVideoId}
          onFinishedVideo={undefined}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2">
          <h1 className="text-2xl font-semibold">{lesson.name}</h1>
          <div className="flex gap-2 justify-end">
            <Suspense fallback={<SkeletonButton />}>
              {!isFetchingPreviousLessonId &&
              previousLesson?.success === true ? (
                <ToLessonButton
                  courseId={courseId}
                  lessonId={previousLesson.data.previousLessonId}
                  isDisabled={isFetchingLessonData}
                >
                  Previous
                </ToLessonButton>
              ) : (
                <Button variant="outline" disabled={true}>
                  Previous
                </Button>
              )}
              <div className="flex items-center gap-2">
                {lesson.isCompleted ? (
                  <>
                    <Button
                      variant="outline"
                      disabled={true}
                      className="disabled:opacity-100 text-green-600 border-green-600"
                    >
                      <CheckCircle />
                      <span>Completed</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleMarkLessonAsComplete(lesson.id)}
                      disabled={
                        isMarkingCompletedLesson || isFetchingLessonData
                      }
                      className="hover:bg-black"
                    >
                      <span>Complete the Lesson</span>
                    </Button>
                  </>
                )}
              </div>
              {!isFetchingNextLessonId && nextLesson?.success === true ? (
                <ToLessonButton
                  courseId={courseId}
                  lessonId={nextLesson.data.nextLessonId}
                  isDisabled={isFetchingLessonData}
                >
                  Next
                </ToLessonButton>
              ) : (
                <Button variant="outline" disabled={true}>
                  Next
                </Button>
              )}
            </Suspense>
          </div>
        </div>
      </div>
      <div className="text-lg">{lesson.description}</div>
    </div>
  );
};

const LessonSkeleton = () => {
  return (
    <div className="container my-5 flex flex-col gap-4">
      <SkeletonText className="w-full h-36 md:h-36 lg:h-80" />
      <div className="flex justify-between items-center">
        <SkeletonText className="w-32 h-8" />
        <div className="flex gap-3">
          <SkeletonButton />
          <SkeletonButton />
          <SkeletonButton />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonText className="w-full" />
        <SkeletonText className="w-full" />
        <SkeletonText className="w-full" />
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
      className="hover:bg-black"
      disabled={isDisabled}
      asChild
    >
      <Link href={`/courses/${courseId}/lessons/${lessonId}`}>{children}</Link>
    </Button>
  );
};
