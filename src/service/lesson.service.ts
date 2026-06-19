import { apiClient } from "./api-client";

const ROUTE_URL = "/lessons";

export type LessonByIdArgs = {
  lessonId: string;
  courseId: string;
};

export type LessonLearningBody = {
  positionSeconds?: number;
  durationSeconds?: number;
  viewed?: boolean;
  note?: string;
  bookmarked?: boolean;
};

export type LessonQuizBody = {
  title: string;
  kind: "quiz" | "exam";
  gradeStrategy: "highest" | "latest" | "average" | "first";
  passingScore: number;
  isGradable: boolean;
  isPublished: boolean;
  timeLimitMinutes?: number | null;
  maxAttempts?: number | null;
  availableFrom?: string | null;
  availableUntil?: string | null;
  questions: {
    prompt: string;
    type:
      | "single_choice"
      | "multiple_choice"
      | "true_false"
      | "short_answer"
      | "long_answer";
    options: string[];
    correctOption: number;
    correctOptions: number[];
    acceptedAnswers: string[];
    caseSensitive: boolean;
    points: number;
    explanation?: string;
  }[];
};

export type QuizResponses = Record<
  string,
  { selectedOptions?: number[]; text?: string }
>;

export type PreviousNextLessonArgs = {
  courseId: string;
  lessonId: string;
  order: number;
  sectionId: string;
};

export type LessonLearningMutationArgs = {
  lessonId: string;
  body: LessonLearningBody;
};

export type LessonQuizMutationArgs = {
  lessonId: string;
  body: LessonQuizBody;
};

export type SubmitLessonQuizArgs = {
  lessonId: string;
  answers: number[];
};

export type QuizAttemptArgs = {
  lessonId: string;
  attemptId: string;
};

export type SaveQuizAttemptArgs = QuizAttemptArgs & {
  responses: QuizResponses;
};

export type GradeQuizAttemptArgs = QuizAttemptArgs & {
  scores: Record<string, number>;
  feedback: string;
};

export const lessonService = {
  getLessons: () => apiClient(ROUTE_URL),
  getLessonById: ({ lessonId, courseId }: LessonByIdArgs) =>
    apiClient(`${ROUTE_URL}/${lessonId}?courseId=${courseId}`),
  getCompletedLessons: () => apiClient(`${ROUTE_URL}/completed`),
  getLessonLearning: (lessonId: string) =>
    apiClient(`${ROUTE_URL}/${lessonId}/learning`),
  getLessonQuiz: (lessonId: string) => apiClient(`${ROUTE_URL}/${lessonId}/quiz`),
  getQuizAttempt: ({ lessonId, attemptId }: QuizAttemptArgs) =>
    apiClient(`${ROUTE_URL}/${lessonId}/quiz/attempt/${attemptId}`),
  getPendingQuizAttempts: (lessonId: string) =>
    apiClient(`${ROUTE_URL}/${lessonId}/quiz/attempts`),
  getPreviousLesson: (args: PreviousNextLessonArgs) =>
    apiClient(
      `${ROUTE_URL}/lesson/previous?courseId=${args.courseId}&lessonId=${args.lessonId}&order=${args.order}&sectionId=${args.sectionId}`,
    ),
  getNextLesson: (args: PreviousNextLessonArgs) =>
    apiClient(
      `${ROUTE_URL}/lesson/next?courseId=${args.courseId}&lessonId=${args.lessonId}&order=${args.order}&sectionId=${args.sectionId}`,
    ),
  addLesson: (data: unknown) =>
    apiClient(ROUTE_URL, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateLesson: ({ id, body }: { id: string; body: unknown }) =>
    apiClient(`${ROUTE_URL}/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteLesson: (id: string) =>
    apiClient(`${ROUTE_URL}/${id}`, {
      method: "DELETE",
    }),
  reorderLessons: (lessonIds: string[]) =>
    apiClient(`${ROUTE_URL}/order`, {
      method: "PUT",
      body: JSON.stringify({ lessonIds }),
    }),
  addCompletedLesson: (lessonId: string) =>
    apiClient(`${ROUTE_URL}/completed`, {
      method: "POST",
      body: JSON.stringify({ lessonId }),
    }),
  saveLessonLearning: ({ lessonId, body }: LessonLearningMutationArgs) =>
    apiClient(`${ROUTE_URL}/${lessonId}/learning`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  saveLessonQuiz: ({ lessonId, body }: LessonQuizMutationArgs) =>
    apiClient(`${ROUTE_URL}/${lessonId}/quiz`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  submitLessonQuiz: ({ lessonId, answers }: SubmitLessonQuizArgs) =>
    apiClient(`${ROUTE_URL}/${lessonId}/quiz`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
  startQuizAttempt: (lessonId: string) =>
    apiClient(`${ROUTE_URL}/${lessonId}/quiz/attempt`, {
      method: "POST",
    }),
  saveQuizAttempt: ({ lessonId, attemptId, responses }: SaveQuizAttemptArgs) =>
    apiClient(`${ROUTE_URL}/${lessonId}/quiz/attempt/${attemptId}`, {
      method: "PATCH",
      body: JSON.stringify({ responses }),
    }),
  finishQuizAttempt: ({ lessonId, attemptId, responses }: SaveQuizAttemptArgs) =>
    apiClient(`${ROUTE_URL}/${lessonId}/quiz/attempt/${attemptId}`, {
      method: "POST",
      body: JSON.stringify({ responses }),
    }),
  gradeQuizAttempt: ({
    lessonId,
    attemptId,
    scores,
    feedback,
  }: GradeQuizAttemptArgs) =>
    apiClient(`${ROUTE_URL}/${lessonId}/quiz/attempts`, {
      method: "PATCH",
      body: JSON.stringify({ attemptId, scores, feedback }),
    }),
};
