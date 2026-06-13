"use client";
import { CourseLessonStatus } from "@/constants/CourseLessonStatus.constant";
import React, { ReactNode, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LessonForm from "../course/LessonForm";
import LessonQuizEditor from "./LessonQuizEditor";
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
      <DialogContent className="left-0 top-0 flex h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0">
        <Tabs
          defaultValue="lesson"
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex flex-col gap-3 border-b bg-background px-5 py-4 pr-14 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <DialogHeader className="text-left">
              <DialogTitle className="line-clamp-1 text-xl">
                {lesson ? `Edit ${lesson.name}` : "Create a new lesson"}
              </DialogTitle>
              <DialogDescription>
                Manage lesson content, video settings, visibility, and its
                optional learner quiz.
              </DialogDescription>
            </DialogHeader>
            {lesson && (
              <TabsList className="grid w-full grid-cols-2 sm:w-64">
                <TabsTrigger value="lesson">Lesson details</TabsTrigger>
                <TabsTrigger value="quiz">Quiz</TabsTrigger>
              </TabsList>
            )}
          </div>
          <TabsContent
            value="lesson"
            className="mt-0 min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
          >
            <LessonForm
              lesson={lesson}
              sectionId={sectionId}
              onSuccess={() => setIsOpen(false)}
            />
          </TabsContent>
          {lesson && (
            <TabsContent
              value="quiz"
              className="mt-0 min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
            >
              <LessonQuizEditor lessonId={lesson.id} />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LessonFormDialog;
