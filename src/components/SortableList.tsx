"use client";
import React, { ReactNode, useEffect, useId, useState } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVerticalIcon } from "lucide-react";

export const SortableList = <T extends { id: string }>({
  items,
  onOrderChange,
  children,
}: {
  items: T[];
  onOrderChange?: (newOrder: string[]) => void;
  children: (items: T[]) => ReactNode;
}) => {
  const dndContextId = useId();
  const [draftItems, setDraftItems] = useState(items);

  useEffect(() => {
    setDraftItems(items);
  }, [items]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = active.id.toString();
    const overId = over?.id.toString();

    if (activeId === overId || overId === undefined) return;

    const getNewArray = (array: T[], activeId: string, overId: string) => {
      const oldIndex = array.findIndex((item) => item.id === activeId);
      const newIndex = array.findIndex((item) => item.id === overId);

      return arrayMove(array, oldIndex, newIndex);
    };

    const nextItems = getNewArray(draftItems, activeId, overId);
    setDraftItems(nextItems);
    onOrderChange?.(nextItems.map((item) => item.id));
  };

  return (
    <DndContext id={dndContextId} onDragEnd={handleDragEnd}>
      <SortableContext
        items={draftItems}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex w-full flex-col gap-2">{children(draftItems)}</div>
      </SortableContext>
    </DndContext>
  );
};

export const SortableItem = ({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) => {
  const {
    setNodeRef,
    transform,
    transition,
    activeIndex,
    index,
    attributes,
    listeners,
  } = useSortable({ id });
  const isActive = activeIndex === index;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "flex items-center gap-2 rounded-xl border border-border/70 bg-background p-2.5 transition-colors hover:border-primary/20 hover:bg-primary/[0.03]",
        isActive && "z-10 border-primary/30 shadow-md",
      )}
    >
      <GripVerticalIcon
        className="size-7 shrink-0 cursor-grab touch-none rounded-md p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
        {...attributes}
        {...listeners}
      />
      <div className={cn("flex-grow", className)}>{children}</div>
    </div>
  );
};
