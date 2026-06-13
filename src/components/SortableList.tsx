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
        <div className="flex flex-col gap-1 w-full">{children(draftItems)}</div>
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
        "flex gap-1 items-center bg-background rounded-xl border border-transparent p-2.5 transition-colors",
        isActive && "z-10 border shadow-md",
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
