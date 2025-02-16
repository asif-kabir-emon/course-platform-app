"use client";
import { CourseSectionStatus } from "@prisma/client";
import React from "react";
import { SortableItem, SortableList } from "@/components/SortableList";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Trash2Icon } from "lucide-react";
import SectionFormDialog from "./SectionFormDialog";
import { DialogTrigger } from "@/components/ui/dialog";
import {
  useDeleteSectionMutation,
  useReorderedSectionsMutation,
} from "@/redux/api/sectionApi";
import { toast } from "sonner";
import { ActionButton } from "@/components/ActionButton";

const SortableSectionList = ({
  courseId,
  sections,
}: {
  courseId: string;
  sections: {
    id: string;
    name: string;
    status: CourseSectionStatus;
  }[];
}) => {
  const [deleteSection, { isLoading: isDeletingSection }] =
    useDeleteSectionMutation();
  const [reorderSections] = useReorderedSectionsMutation();

  const handleDeleteSection = async (id: string) => {
    const toastId = toast.loading("Deleting section ...", {
      duration: 2000,
      position: "top-center",
    });
    try {
      const response = await deleteSection(id).unwrap();

      if (response.success) {
        toast.success(response.message, { id: toastId, duration: 2000 });
      } else {
        toast.error(response.message, { id: toastId, duration: 2000 });
      } // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to delete section", { id: toastId, duration: 2000 });
    }
  };

  const handleReorderSections = async (newOrder: string[]) => {
    if (newOrder.length === 0) {
      return { error: true, message: "Error reordering your sections" };
    }

    try {
      const response = await reorderSections(newOrder).unwrap();

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
      items={sections}
      onOrderChange={async (newOrder: string[]) =>
        handleReorderSections(newOrder)
      }
    >
      {(items) =>
        items.map((section) => (
          <SortableItem
            key={section.id}
            id={section.id}
            className="flex items-center gap-1"
          >
            <div
              className={cn(
                "contents",
                section.status === CourseSectionStatus.private &&
                  "text-muted-foreground",
              )}
            >
              {section.status === CourseSectionStatus.public && (
                <Eye className="size-4" />
              )}
              {section.status === CourseSectionStatus.private && (
                <EyeOff className="size-4" />
              )}
              {section.name}
            </div>
            <SectionFormDialog courseId={courseId} section={section}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-black hover:text-white ml-auto"
                >
                  Edit
                </Button>
              </DialogTrigger>
            </SectionFormDialog>
            <ActionButton
              action={() => {
                handleDeleteSection(section.id);
              }}
              tryAction={isDeletingSection}
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

export default SortableSectionList;
