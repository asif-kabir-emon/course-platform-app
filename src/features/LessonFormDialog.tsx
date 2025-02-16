"use client";
import { CourseLessonStatus } from "@prisma/client";
import React, { ReactNode, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LessonForm from "./LessonForm";
const LessonFormDialog = ({
  sectionId,
  lesson,
  children,
}: {
  sectionId: string;
  lesson?: {
    id: string;
    name: string;
    description: string;
    youtubeVideoId: string;
    status: CourseLessonStatus;
  };
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {lesson ? `Edit ${lesson.name}` : "New Lesson"}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <LessonForm
            lesson={lesson}
            sectionId={sectionId}
            onSuccess={() => setIsOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LessonFormDialog;
