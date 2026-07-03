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
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronLeft,
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
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {lesson.name}
        </h1>
      </header>
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
          <div className="flex min-h-48 flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 p-6 text-center">
            <CheckCircle2 className="size-10 text-primary" />
            <h2 className="mt-3 text-xl font-semibold">Ready to begin?</h2>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              Review the attempt window and quiz rules below before submitting
              your answers.
            </p>
          </div>
        )}
        {isLearnerSession && (
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
                    disabled={isMarkingCompletedLesson || isFetchingLessonData}
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
    <Tabs defaultValue={defaultTab} className="surface-panel overflow-hidden">
      <div className="border-b px-4 pt-4 sm:px-5">
        <TabsList className="h-auto w-full justify-start rounded-none bg-transparent p-0">
          {showAbout && (
            <TabsTrigger
              value="about"
              className="gap-2 rounded-none border-b-2 border-transparent px-4 py-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              <PlayCircle className="size-4" />
              About
            </TabsTrigger>
          )}
          {showLearningTools && (
            <TabsTrigger
              value="tools"
              className="gap-2 rounded-none border-b-2 border-transparent px-4 py-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              <NotebookPen className="size-4" />
              Notes
            </TabsTrigger>
          )}
        </TabsList>
      </div>
      {showAbout && (
        <TabsContent value="about" className="m-0 p-5 sm:p-6">
          <div className="max-w-none text-muted-foreground">
            {description ? (
              <MarkdownContent content={description} />
            ) : (
              <p className="leading-7">No additional lesson description.</p>
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
  const [bookmarked, setBookmarked] = useState(false);
  const [saveLessonLearning, { isLoading: isSaving }] =
    useSaveLessonLearningMutation();

  useEffect(() => {
    if (learningData?.success) {
      setNote(learningData.data.note);
      setSavedNote(learningData.data.note);
      setIsEditingNote(!learningData.data.note);
      setBookmarked(learningData.data.bookmarked);
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

  const toggleBookmark = async () => {
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);

    try {
      await saveLessonLearning({
        lessonId,
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

  return (
    <section className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <NotebookPen className="size-5 text-primary" />
            Personal learning tools
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Notes and bookmarks are private to your account.
          </p>
        </div>
        <Button
          variant={bookmarked ? "default" : "outline"}
          onClick={toggleBookmark}
          disabled={isLoading || isSaving}
          className="w-full sm:w-auto"
        >
          {bookmarked ? <BookmarkCheck /> : <Bookmark />}
          {bookmarked ? "Bookmarked" : "Bookmark lesson"}
        </Button>
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
              >
                <Pencil className="size-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={removeNote}
                disabled={isSaving}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
                Remove
              </Button>
            </div>
          )}
        </div>
        {savedNote && !isEditingNote ? (
          <div className="min-h-28 whitespace-pre-wrap rounded-xl border bg-muted/25 p-4 text-sm leading-7">
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
                  >
                    Cancel
                  </Button>
                )}
                <Button onClick={saveNote} disabled={isLoading || isSaving}>
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
