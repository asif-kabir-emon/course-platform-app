"use client";

import QuizAttempt from "@/features/lesson/QuizAttempt";
import { use } from "react";

const QuizAttemptPage = ({
  params,
}: {
  params: Promise<{
    courseId: string;
    lessonId: string;
    attemptId: string;
  }>;
}) => {
  const { courseId, lessonId, attemptId } = use(params);

  return (
    <QuizAttempt
      courseId={courseId}
      lessonId={lessonId}
      attemptId={attemptId}
    />
  );
};

export default QuizAttemptPage;
