"use client";
import { SkeletonButton, SkeletonText } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import YoutubeVideoPlayer from "@/components/YoutubeVideoPlayer";
import {
  useAddCompletedLessonMutation,
  useGetLessonByIdQuery,
  useGetLessonLearningQuery,
  useGetNextLessonQuery,
  useGetPreviousLessonQuery,
  useSaveLessonLearningMutation,
} from "@/hooks/lesson.hook";
import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  FileText,
  LockIcon,
  NotebookPen,
  Pencil,
  PlayCircle,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import React, {
  ReactNode,
  Suspense,
  use,
  useCallback,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import LessonQuiz from "@/features/lesson/LessonQuiz";
import { CourseLessonType } from "@/constants/CourseLessonType.constant";
import MarkdownContent from "@/components/MarkdownContent";
import { cn } from "@/lib/utils";

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
    type?: CourseLessonType;
    content?: string;
    youtubeVideoId: string;
    sectionId: string;
    order: number;
    description: string;
    isCompleted: boolean;
    hasAccess: boolean;
    isAdminPreview?: boolean;
  };
  isFetchingLessonData: boolean;
  courseId: string;
}) => {
  const [addCompletedLesson, { isLoading: isMarkingCompletedLesson }] =
    useAddCompletedLessonMutation();
  const isLearnerSession = lesson.hasAccess && !lesson.isAdminPreview;
  const { data: learningData, isLoading: isLearningDataLoading } =
    useGetLessonLearningQuery(lesson.id, {
      skip: !isLearnerSession,
    });
  const [saveLessonLearning] = useSaveLessonLearningMutation();
  const lessonType = lesson.type ?? CourseLessonType.video;

  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (learningData?.success) {
      setBookmarked(learningData.data.bookmarked);
    }
  }, [learningData]);

  const toggleBookmark = async () => {
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);

    try {
      await saveLessonLearning({
        lessonId: lesson.id,
        body: { bookmarked: nextBookmarked },
      }).unwrap();
      toast.success(
        nextBookmarked ? "Lesson bookmarked." : "Bookmark removed.",
      );
    } catch {
      setBookmarked(!nextBookmarked);
      toast.error("Failed to update the bookmark.");
    }
  };

  const handleVideoProgress = useCallback(
    (positionSeconds: number, durationSeconds: number) => {
      void saveLessonLearning({
        lessonId: lesson.id,
        body: { positionSeconds, durationSeconds },
      });
    },
    [lesson.id, saveLessonLearning],
  );

  useEffect(() => {
    if (!isLearnerSession) return;

    void saveLessonLearning({
      lessonId: lesson.id,
      body: { viewed: true },
    });
  }, [isLearnerSession, lesson.id, saveLessonLearning]);

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
          duration: 5000,
        });
      } else {
        toast.error(response.message, {
          duration: 5000,
        });
      }
    } catch {
      toast.error("Failed to mark lesson as completed!", {
        duration: 5000,
      });
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {lesson.name}
        </h1>
        {isLearnerSession && (
          <Button
            variant={bookmarked ? "default" : "outline"}
            onClick={toggleBookmark}
            disabled={isLearningDataLoading}
            className={cn(
              "shrink-0 gap-2 rounded-lg transition-all self-start sm:self-center text-xs h-9",
              bookmarked
                ? "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white shadow-sm"
                : "border-slate-200 hover:bg-slate-50 text-slate-700",
            )}
          >
            {bookmarked ? (
              <BookmarkCheck className="size-4 fill-white text-white" />
            ) : (
              <Bookmark className="size-4" />
            )}
            {bookmarked ? "Bookmarked" : "Bookmark lesson"}
          </Button>
        )}
      </header>
      {lesson.hasAccess && (
        <div className="lg:hidden">
          <Button variant="outline" className="w-full sm:w-auto rounded-lg" asChild>
            <Link href={`/courses/${courseId}`}>
              <ChevronLeft className="size-5" />
              Course content
            </Link>
          </Button>
        </div>
      )}
      <section className="surface-panel overflow-hidden">
        {lessonType === CourseLessonType.video && (
          <div className="aspect-video bg-black">
            <YoutubeVideoPlayer
              videoId={lesson.youtubeVideoId}
              onFinishedVideo={undefined}
              initialPositionSeconds={
                learningData?.success ? learningData.data.positionSeconds : 0
              }
              onProgress={isLearnerSession ? handleVideoProgress : undefined}
            />
          </div>
        )}
        {lessonType === CourseLessonType.text && (
          <article className="max-w-none p-5 text-[0.98rem] sm:p-8">
            <MarkdownContent content={lesson.content || ""} />
          </article>
        )}
        {lessonType === CourseLessonType.quiz && (
          <div className="flex min-h-56 flex-col items-center justify-center bg-gradient-to-b from-blue-50/40 via-indigo-50/10 to-transparent p-8 text-center border-b border-border/50">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary ring-8 ring-primary/5 mb-4">
              <CircleHelp className="size-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Ready to begin?</h2>
            <p className="mt-2 max-w-lg text-sm text-slate-500 leading-relaxed">
              Review the attempt window and quiz rules below before submitting
              your answers.
            </p>
          </div>
        )}
        {isLearnerSession && (
          <div className="flex flex-col gap-3 border-t border-border/80 bg-slate-50/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <Suspense fallback={<SkeletonButton />}>
              <div>
                {lesson.isCompleted ? (
                  <Button
                    variant="outline"
                    disabled
                    className="w-full border-emerald-200 bg-emerald-50 text-emerald-700 disabled:opacity-100 sm:w-auto font-medium gap-2 rounded-lg"
                  >
                    <CheckCircle2 className="size-4 shrink-0 fill-emerald-600 text-white" />
                    <span>Completed</span>
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleMarkLessonAsComplete(lesson.id)}
                    disabled={isMarkingCompletedLesson || isFetchingLessonData}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-white shadow-sm font-semibold gap-2 rounded-lg"
                  >
                    <CheckCircle2 className="size-4" />
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
                    <ChevronLeft className="size-4 shrink-0" />
                    <span>Previous</span>
                  </ToLessonButton>
                ) : (
                  <Button variant="outline" disabled className="gap-1.5 rounded-lg text-slate-400">
                    <ChevronLeft className="size-4 shrink-0" />
                    Previous
                  </Button>
                )}
                {!isFetchingNextLessonId && nextLesson?.success === true ? (
                  <ToLessonButton
                    courseId={courseId}
                    lessonId={nextLesson.data.nextLessonId}
                    isDisabled={isFetchingLessonData}
                  >
                    <span>Next</span>
                    <ChevronRight className="size-4 shrink-0" />
                  </ToLessonButton>
                ) : (
                  <Button variant="outline" disabled className="gap-1.5 rounded-lg text-slate-400">
                    Next
                    <ChevronRight className="size-4 shrink-0" />
                  </Button>
                )}
              </div>
            </Suspense>
          </div>
        )}
      </section>

      {isLearnerSession && (
        <>
          <LessonDetailsTabs
            description={lesson.description}
            showAbout={lessonType !== CourseLessonType.text}
            lessonId={lesson.id}
            learningData={learningData}
            isLearningToolsLoading={isLearningDataLoading}
            showLearningTools
          />
          <LessonQuiz lessonId={lesson.id} courseId={courseId} />
        </>
      )}
      {!isLearnerSession && lessonType !== CourseLessonType.text && (
        <LessonDetailsTabs
          description={lesson.description}
          showAbout
          showLearningTools={false}
        />
      )}
      {lesson.isAdminPreview && (
        <section className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-primary">
          Admin preview mode is active. Progress, completion, notes, and quiz
          attempts are not recorded.
        </section>
      )}
    </div>
  );
};

const LessonDetailsTabs = ({
  description,
  showAbout,
  showLearningTools,
  lessonId,
  learningData,
  isLearningToolsLoading = false,
}: {
  description?: string;
  showAbout: boolean;
  showLearningTools: boolean;
  lessonId?: string;
  learningData?: {
    success: boolean;
    data: {
      note: string;
      bookmarked: boolean;
      positionSeconds: number;
    };
  };
  isLearningToolsLoading?: boolean;
}) => {
  const defaultTab = showAbout ? "about" : "tools";

  if (!showAbout && !showLearningTools) {
    return null;
  }

  return (
    <Tabs defaultValue={defaultTab} className="surface-panel overflow-hidden mt-6">
      <div className="border-b border-border bg-[#f8fafc]/50 px-4 pt-3 sm:px-5">
        <TabsList className="h-auto w-full justify-start rounded-none bg-transparent p-0 gap-2">
          {showAbout && (
            <TabsTrigger
              value="about"
              className="gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-semibold shadow-none text-slate-500 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none transition-all"
            >
              <PlayCircle className="size-4" />
              About
            </TabsTrigger>
          )}
          {showLearningTools && (
            <TabsTrigger
              value="tools"
              className="gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-semibold shadow-none text-slate-500 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none transition-all"
            >
              <NotebookPen className="size-4" />
              Notes
            </TabsTrigger>
          )}
        </TabsList>
      </div>
      {showAbout && (
        <TabsContent value="about" className="m-0 p-5 sm:p-6">
          <div className="max-w-none text-slate-600 leading-relaxed">
            {description ? (
              <MarkdownContent content={description} />
            ) : (
              <p className="leading-7 text-slate-500">No additional lesson description.</p>
            )}
          </div>
        </TabsContent>
      )}
      {showLearningTools && lessonId && (
        <TabsContent value="tools" className="m-0">
          <LessonLearningTools
            lessonId={lessonId}
            learningData={learningData}
            isLoading={isLearningToolsLoading}
          />
        </TabsContent>
      )}
    </Tabs>
  );
};

const LessonLearningTools = ({
  lessonId,
  learningData,
  isLoading,
}: {
  lessonId: string;
  learningData?: {
    success: boolean;
    data: {
      note: string;
      bookmarked: boolean;
      positionSeconds: number;
    };
  };
  isLoading: boolean;
}) => {
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [saveLessonLearning, { isLoading: isSaving }] =
    useSaveLessonLearningMutation();

  useEffect(() => {
    if (learningData?.success) {
      setNote(learningData.data.note);
      setSavedNote(learningData.data.note);
      setIsEditingNote(!learningData.data.note);
    }
  }, [learningData]);

  const saveNote = async () => {
    try {
      await saveLessonLearning({
        lessonId,
        body: { note },
      }).unwrap();
      const normalizedNote = note.trim();
      setSavedNote(normalizedNote);
      setNote(normalizedNote);
      setIsEditingNote(false);
      toast.success(
        note.trim() ? "Lesson note saved." : "Lesson note removed.",
      );
    } catch {
      toast.error("Failed to save your lesson note.");
    }
  };

  const removeNote = async () => {
    try {
      await saveLessonLearning({
        lessonId,
        body: { note: "" },
      }).unwrap();
      setNote("");
      setSavedNote("");
      setIsEditingNote(true);
      toast.success("Lesson note removed.");
    } catch {
      toast.error("Failed to remove your lesson note.");
    }
  };

  return (
    <section className="p-5 sm:p-6">
      <div className="flex items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold sm:text-base">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary border border-primary/10">
              <NotebookPen className="size-4" />
            </span>
            <span>Personal learning tools</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Notes are private to your account.
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="lesson-note" className="text-sm font-medium">
            Lesson notes
          </label>
          {savedNote && !isEditingNote && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingNote(true)}
                className="h-8 gap-1.5 text-xs text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg"
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={removeNote}
                disabled={isSaving}
                className="h-8 gap-1.5 text-xs text-destructive border-slate-200 hover:bg-destructive/5 hover:border-destructive/20 rounded-lg"
              >
                <Trash2 className="size-3.5" />
                Remove
              </Button>
            </div>
          )}
        </div>
        {savedNote && !isEditingNote ? (
          <div className="min-h-28 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50/40 p-5 text-sm leading-6 text-slate-700 shadow-sm">
            {savedNote}
          </div>
        ) : (
          <>
            <Textarea
              id="lesson-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Write a key takeaway, question, or reminder..."
              maxLength={5000}
              disabled={isLoading}
              className="min-h-32"
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-muted-foreground">
                {note.length}/5000 characters
              </span>
              <div className="flex gap-2">
                {savedNote && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNote(savedNote);
                      setIsEditingNote(false);
                    }}
                    className="rounded-lg"
                  >
                    Cancel
                  </Button>
                )}
                <Button onClick={saveNote} disabled={isLoading || isSaving} className="rounded-lg">
                  <Save />
                  {savedNote ? "Update note" : "Save note"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

const LessonSkeleton = () => {
  return (
    <div className="space-y-5">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SkeletonText className="h-8 w-64 sm:w-96 rounded-md" />
        <SkeletonText className="h-9 w-32 rounded-lg" />
      </div>

      {/* Video / Content Panel Skeleton */}
      <div className="surface-panel overflow-hidden">
        <SkeletonText className="aspect-video w-full rounded-none" />
        <div className="flex flex-col gap-3 border-t border-border/80 bg-slate-50/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <SkeletonText className="h-10 w-36 rounded-lg" />
          <div className="flex gap-2">
            <SkeletonText className="h-10 w-24 rounded-lg" />
            <SkeletonText className="h-10 w-20 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Tabs & Content Skeleton */}
      <div className="surface-panel overflow-hidden mt-6">
        <div className="border-b border-border bg-[#f8fafc]/50 px-4 pt-3 sm:px-5 h-12 flex gap-4">
          <SkeletonText className="h-4 w-16 mt-1" />
          <SkeletonText className="h-4 w-16 mt-1" />
        </div>
        <div className="p-5 sm:p-6 space-y-3">
          <SkeletonText className="h-4 w-1/3" />
          <SkeletonText className="h-4 w-full" />
          <SkeletonText className="h-4 w-full" />
          <SkeletonText className="h-4 w-2/3" />
        </div>
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
      className="w-full sm:w-auto gap-1.5 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
      disabled={isDisabled}
      asChild
    >
      <Link href={`/courses/${courseId}/lessons/${lessonId}`}>{children}</Link>
    </Button>
  );
};
