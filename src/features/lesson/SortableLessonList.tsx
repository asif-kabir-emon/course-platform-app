"use client";
import { CourseLessonStatus } from "@/constants/CourseLessonStatus.constant";
import { CourseLessonType } from "@/constants/CourseLessonType.constant";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CircleHelp,
  Eye,
  EyeOff,
  FileText,
  Pencil,
  Save,
  Trash2Icon,
  Video,
} from "lucide-react";
import { DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import LessonFormDialog from "./LessonFormDialog";
import {
  useDeleteLessonMutation,
  useReorderedLessonsMutation,
} from "@/hooks/lesson.hook";
import { ActionButton } from "@/components/ActionButton";
import { SortableItem, SortableList } from "@/components/SortableList";

const SortableLessonList = ({
  sectionId,
  lessons,
}: {
  sectionId: string;
  lessons: {
    id: string;
    name: string;
    description: string;
    youtubeVideoId: string;
    type?: CourseLessonType;
    content?: string;
    status: CourseLessonStatus;
  }[];
}) => {
  const [deleteLesson, { isLoading: isDeletingLesson }] =
    useDeleteLessonMutation();
  const [reorderLessons] = useReorderedLessonsMutation();
  const [draftOrder, setDraftOrder] = useState<string[] | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const handleDeleteLesson = async (id: string) => {
    const toastId = toast.loading("Deleting lesson ...", {
      duration: 2000,
    });
    try {
      const response = await deleteLesson(id).unwrap();

      if (response.success) {
        toast.success(response.message, { id: toastId, duration: 2000 });
      } else {
        toast.error(response.message, { id: toastId, duration: 2000 });
      } // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to delete lesson", { id: toastId, duration: 2000 });
    }
  };

  const handleReorderLessons = async () => {
    if (!draftOrder?.length) return;

    setIsSavingOrder(true);
    try {
      const response = await reorderLessons(draftOrder).unwrap();

      if (response.success) {
        setDraftOrder(null);
        toast.success("Lesson order saved.");
      } else {
        toast.error(response.message);
      }
    } catch {
      toast.error("Failed to save lesson order.");
    } finally {
      setIsSavingOrder(false);
    }
  };

  return (
    <div>
      <SortableList items={lessons} onOrderChange={setDraftOrder}>
        {(items) =>
          items.map((lesson) => (
            <SortableItem
              key={lesson.id}
              id={lesson.id}
              className="flex min-h-12 min-w-0 items-center gap-2"
            >
              <div
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-3",
                  lesson.status === CourseLessonStatus.private &&
                    "text-muted-foreground",
                )}
                title={lesson.name}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  {lesson.type === CourseLessonType.text ? (
                    <FileText className="size-4" />
                  ) : lesson.type === CourseLessonType.quiz ? (
                    <CircleHelp className="size-4" />
                  ) : (
                    <Video className="size-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {lesson.name}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-[11px] capitalize text-muted-foreground">
                    <span>{lesson.type ?? CourseLessonType.video}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="inline-flex items-center gap-1">
                      {lesson.status === CourseLessonStatus.public && (
                        <Eye className="size-3 text-emerald-600" />
                      )}
                      {lesson.status === CourseLessonStatus.private && (
                        <EyeOff className="size-3" />
                      )}
                      {lesson.status === CourseLessonStatus.preview && (
                        <Video className="size-3 text-amber-600" />
                      )}
                      {lesson.status}
                    </span>
                  </span>
                </span>
              </div>
              <LessonFormDialog sectionId={sectionId} lesson={lesson}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="ml-auto size-8 shrink-0 hover:bg-primary/5 hover:text-primary"
                    aria-label={`Edit ${lesson.name}`}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </DialogTrigger>
              </LessonFormDialog>
              <ActionButton
                action={() => {
                  handleDeleteLesson(lesson.id);
                }}
                tryAction={isDeletingLesson}
              >
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 shrink-0 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  aria-label={`Delete ${lesson.name}`}
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </ActionButton>
            </SortableItem>
          ))
        }
      </SortableList>
      {draftOrder && (
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-primary">
            Lesson order changed. Save when you are ready.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={handleReorderLessons}
            disabled={isSavingOrder}
          >
            <Save className="size-4" />
            {isSavingOrder ? "Saving..." : "Save lesson order"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SortableLessonList;
