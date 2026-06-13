"use client";
import { CourseLessonStatus } from "@/constants/CourseLessonStatus.constant";
import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Trash2Icon, Video } from "lucide-react";
import { DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import LessonFormDialog from "./LessonFormDialog";
import {
  useDeleteLessonMutation,
  useReorderedLessonsMutation,
} from "@/redux/api/lessonApi";
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
    status: CourseLessonStatus;
  }[];
}) => {
  const [deleteLesson, { isLoading: isDeletingLesson }] =
    useDeleteLessonMutation();
  const [reorderLessons] = useReorderedLessonsMutation();

  const handleDeleteLesson = async (id: string) => {
    const toastId = toast.loading("Deleting section ...", {
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
      toast.error("Failed to delete section", { id: toastId, duration: 2000 });
    }
  };

  const handleReorderLessons = async (newOrder: string[]) => {
    if (newOrder.length === 0) {
      return { error: true, message: "Error reordering your sections" };
    }

    try {
      const response = await reorderLessons(newOrder).unwrap();

      if (response.success) {
        toast.success(response.message, {
          duration: 2000,
        });
        return {
          error: false,
          message: "Successfully reordered your sections",
        };
      } else {
        toast.error(response.message, {
          duration: 2000,
        });
        return { error: true, message: "Error reordering your sections" };
      } // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to delete section", {
        duration: 2000,
      });
      return { error: true, message: "Error reordering your sections" };
    }
  };

  return (
    <SortableList
      items={lessons}
      onOrderChange={async (newOrder: string[]) =>
        handleReorderLessons(newOrder)
      }
    >
      {(items) =>
        items.map((lesson) => (
          <SortableItem
            key={lesson.id}
            id={lesson.id}
            className="flex min-w-0 items-center gap-2"
          >
            <div
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2",
                lesson.status === CourseLessonStatus.private &&
                  "text-muted-foreground",
              )}
            >
              {lesson.status === CourseLessonStatus.public && (
                <Eye className="size-4" />
              )}
              {lesson.status === CourseLessonStatus.private && (
                <EyeOff className="size-4" />
              )}
              {lesson.status === CourseLessonStatus.preview && (
                <Video className="size-4" />
              )}
              <span className="truncate text-sm font-medium">
                {lesson.name}
              </span>
            </div>
            <LessonFormDialog sectionId={sectionId} lesson={lesson}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto shrink-0 px-2.5 hover:bg-primary/5 hover:text-primary"
                >
                  Edit
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
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2Icon />
                <span className="sr-only">Delete</span>
              </Button>
            </ActionButton>
          </SortableItem>
        ))
      }
    </SortableList>
  );
};

export default SortableLessonList;
