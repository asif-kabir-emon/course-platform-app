"use client";
import { CourseSectionStatus } from "@/constants/CourseSectionStatus.constant";
import React, { useState } from "react";
import { SortableItem, SortableList } from "@/components/SortableList";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Save, Trash2Icon } from "lucide-react";
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
  const [draftOrder, setDraftOrder] = useState<string[] | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const handleDeleteSection = async (id: string) => {
    const toastId = toast.loading("Deleting section ...", {
      duration: 2000,
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

  const handleReorderSections = async () => {
    if (!draftOrder?.length) return;

    setIsSavingOrder(true);
    try {
      const response = await reorderSections(draftOrder).unwrap();

      if (response.success) {
        setDraftOrder(null);
        toast.success("Section order saved.");
      } else {
        toast.error(response.message);
      }
    } catch {
      toast.error("Failed to save section order.");
    } finally {
      setIsSavingOrder(false);
    }
  };

  return (
    <div>
      <SortableList items={sections} onOrderChange={setDraftOrder}>
        {(items) =>
          items.map((section) => (
            <SortableItem
              key={section.id}
              id={section.id}
              className="flex min-w-0 items-center gap-2"
            >
              <div
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2",
                  section.status === CourseSectionStatus.private &&
                    "text-muted-foreground",
                )}
                title={section.name}
              >
                {section.status === CourseSectionStatus.public && (
                  <Eye className="size-4" />
                )}
                {section.status === CourseSectionStatus.private && (
                  <EyeOff className="size-4" />
                )}
                <span className="truncate text-sm font-medium">
                  {section.name}
                </span>
              </div>
              <SectionFormDialog courseId={courseId} section={section}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto shrink-0 px-2.5 hover:bg-primary/5 hover:text-primary"
                  >
                    <span className="hidden sm:inline">Edit</span>
                    <span className="sm:hidden">Edit</span>
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
      {draftOrder && (
        <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs text-primary">
            Section order changed. Save to publish it.
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-3 w-full"
            onClick={handleReorderSections}
            disabled={isSavingOrder}
          >
            <Save className="size-4" />
            {isSavingOrder ? "Saving..." : "Save section order"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SortableSectionList;
