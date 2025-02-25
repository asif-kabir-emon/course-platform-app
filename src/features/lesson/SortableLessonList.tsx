"use client";
import { CourseLessonStatus } from "@prisma/client";
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
      position: "top-center",
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
          position: "top-center",
          duration: 2000,
        });
        return {
          error: false,
          message: "Successfully reordered your sections",
        };
      } else {
        toast.error(response.message, {
          position: "top-center",
          duration: 2000,
        });
        return { error: true, message: "Error reordering your sections" };
      } // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to delete section", {
        position: "top-center",
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
            className="flex items-center gap-1"
          >
            <div
              className={cn(
                "contents",
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
              {lesson.name}
            </div>
            <LessonFormDialog sectionId={sectionId} lesson={lesson}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-black hover:text-white ml-auto"
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
                className="border-red-500 hover:bg-red-500 text-red-500"
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
