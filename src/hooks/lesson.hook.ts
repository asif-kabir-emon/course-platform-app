"use client";

import { useApiMutation, useApiQuery } from "@/helpers/tanstack/api";
import {
  lessonService,
  type LessonByIdArgs,
  type LessonLearningMutationArgs,
  type LessonQuizMutationArgs,
  type PreviousNextLessonArgs,
  type QuizAttemptArgs,
  type SaveQuizAttemptArgs,
  type SubmitLessonQuizArgs,
} from "@/service/lesson.service";

const lessonKeys = {
  all: ["lessons"] as const,
  courses: ["courses"] as const,
  detail: (lessonId: string, courseId?: string) =>
    ["lessons", lessonId, courseId] as const,
  completed: ["lessons", "completed"] as const,
  learning: (lessonId: string) => ["lessons", lessonId, "learning"] as const,
  quiz: (lessonId: string) => ["lessons", lessonId, "quiz"] as const,
  attempt: (lessonId: string, attemptId: string) =>
    ["lessons", lessonId, "quiz", "attempt", attemptId] as const,
  attempts: (lessonId: string) => ["lessons", lessonId, "quiz", "attempts"] as const,
  previous: (args: PreviousNextLessonArgs) => ["lessons", "previous", args] as const,
  next: (args: PreviousNextLessonArgs) => ["lessons", "next", args] as const,
  bookmarks: ["learning", "bookmarks"] as const,
  grades: ["learning", "grades"] as const,
};

type QueryOptions = {
  skip?: boolean;
  refetchOnFocus?: boolean;
  refetchOnMountOrArgChange?: boolean;
};

export const useGetLessonsQuery = (args?: unknown) => {
  void args;
  return useApiQuery(lessonKeys.all, lessonService.getLessons);
};

export const useGetLessonByIdQuery = ({ lessonId, courseId }: LessonByIdArgs) =>
  useApiQuery(
    lessonKeys.detail(lessonId, courseId),
    () => lessonService.getLessonById({ lessonId, courseId }),
    { skip: !lessonId || !courseId },
  );

export const useGetCompletedLessonsQuery = (args?: unknown) => {
  void args;
  return useApiQuery(lessonKeys.completed, lessonService.getCompletedLessons);
};

export const useGetLessonLearningQuery = (
  lessonId: string,
  options?: QueryOptions,
) =>
  useApiQuery(
    lessonKeys.learning(lessonId),
    () => lessonService.getLessonLearning(lessonId),
    { ...options, skip: options?.skip || !lessonId },
  );

export const useGetLessonQuizQuery = (lessonId: string) =>
  useApiQuery(
    lessonKeys.quiz(lessonId),
    () => lessonService.getLessonQuiz(lessonId),
    { skip: !lessonId },
  );

export const useGetQuizAttemptQuery = ({ lessonId, attemptId }: QuizAttemptArgs) =>
  useApiQuery(
    lessonKeys.attempt(lessonId, attemptId),
    () => lessonService.getQuizAttempt({ lessonId, attemptId }),
    { skip: !lessonId || !attemptId },
  );

export const useGetPendingQuizAttemptsQuery = (lessonId: string) =>
  useApiQuery(
    lessonKeys.attempts(lessonId),
    () => lessonService.getPendingQuizAttempts(lessonId),
    { skip: !lessonId },
  );

export const useGetPreviousLessonQuery = (args: PreviousNextLessonArgs) =>
  useApiQuery(
    lessonKeys.previous(args),
    () => lessonService.getPreviousLesson(args),
    { skip: !args.courseId || !args.lessonId || !args.sectionId },
  );

export const useGetNextLessonQuery = (args: PreviousNextLessonArgs) =>
  useApiQuery(
    lessonKeys.next(args),
    () => lessonService.getNextLesson(args),
    { skip: !args.courseId || !args.lessonId || !args.sectionId },
  );

export const useAddLessonMutation = () =>
  useApiMutation({
    mutationFn: lessonService.addLesson,
    invalidateKeys: [lessonKeys.all, lessonKeys.courses],
  });

export const useUpdateLessonMutation = () =>
  useApiMutation({
    mutationFn: lessonService.updateLesson,
    invalidateKeys: [lessonKeys.all, lessonKeys.courses],
  });

export const useDeleteLessonMutation = () =>
  useApiMutation({
    mutationFn: lessonService.deleteLesson,
    invalidateKeys: [lessonKeys.all, lessonKeys.courses],
  });

export const useReorderedLessonsMutation = () =>
  useApiMutation({
    mutationFn: lessonService.reorderLessons,
    invalidateKeys: [lessonKeys.all, lessonKeys.courses],
  });

export const useAddCompletedLessonMutation = () =>
  useApiMutation({
    mutationFn: lessonService.addCompletedLesson,
    invalidateKeys: [lessonKeys.completed, lessonKeys.all, lessonKeys.courses],
  });

export const useSaveLessonLearningMutation = () =>
  useApiMutation<LessonLearningMutationArgs>({
    mutationFn: lessonService.saveLessonLearning,
    getInvalidateKeys: ({ lessonId, body }) => {
      if (body.note !== undefined || body.bookmarked !== undefined) {
        return [lessonKeys.learning(lessonId), lessonKeys.bookmarks];
      }

      return [lessonKeys.learning(lessonId)];
    },
  });

export const useSaveLessonQuizMutation = () =>
  useApiMutation<LessonQuizMutationArgs>({
    mutationFn: lessonService.saveLessonQuiz,
    getInvalidateKeys: ({ lessonId }) => [
      lessonKeys.quiz(lessonId),
      lessonKeys.attempts(lessonId),
      lessonKeys.grades,
    ],
  });

export const useSubmitLessonQuizMutation = () =>
  useApiMutation<SubmitLessonQuizArgs>({
    mutationFn: lessonService.submitLessonQuiz,
    getInvalidateKeys: ({ lessonId }) => [lessonKeys.quiz(lessonId)],
  });

export const useStartQuizAttemptMutation = () =>
  useApiMutation<string>({
    mutationFn: lessonService.startQuizAttempt,
    getInvalidateKeys: (lessonId) => [lessonKeys.quiz(lessonId)],
  });

export const useSaveQuizAttemptMutation = () =>
  useApiMutation<SaveQuizAttemptArgs>({
    mutationFn: lessonService.saveQuizAttempt,
    getInvalidateKeys: ({ lessonId, attemptId }) => [
      lessonKeys.attempt(lessonId, attemptId),
    ],
  });

export const useFinishQuizAttemptMutation = () =>
  useApiMutation<SaveQuizAttemptArgs>({
    mutationFn: lessonService.finishQuizAttempt,
    getInvalidateKeys: ({ lessonId, attemptId }) => [
      lessonKeys.quiz(lessonId),
      lessonKeys.attempt(lessonId, attemptId),
      lessonKeys.grades,
    ],
  });

export const useGradeQuizAttemptMutation = () =>
  useApiMutation({
    mutationFn: lessonService.gradeQuizAttempt,
    getInvalidateKeys: ({ lessonId, attemptId }) => [
      lessonKeys.attempts(lessonId),
      lessonKeys.attempt(lessonId, attemptId),
      lessonKeys.grades,
    ],
  });
