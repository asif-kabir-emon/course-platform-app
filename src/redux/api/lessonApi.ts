import { TagTypes } from "../tagTypes";
import { baseApi } from "./baseApi";
const Route_URL = "/lessons";

export const LessonApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    addLesson: build.mutation({
      query: (data) => ({
        url: `${Route_URL}`,
        method: "POST",
        data: data,
      }),
      invalidatesTags: [TagTypes.course, TagTypes.lesson],
    }),
    getLessons: build.query({
      query: () => ({
        url: `${Route_URL}`,
        method: "GET",
      }),
      providesTags: [TagTypes.lesson],
    }),
    getLessonById: build.query({
      query: ({
        courseId,
        lessonId,
      }: {
        lessonId: string;
        courseId: string;
      }) => ({
        url: `${Route_URL}/${lessonId}?courseId=${courseId}`,
        method: "GET",
        data: { courseId },
      }),
      providesTags: [TagTypes.lesson],
    }),
    updateLesson: build.mutation({
      query: ({ id, body }) => ({
        url: `${Route_URL}/${id}`,
        method: "PUT",
        data: body,
      }),
      invalidatesTags: [TagTypes.course, TagTypes.lesson],
    }),
    deleteLesson: build.mutation({
      query: (id: string) => ({
        url: `${Route_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [TagTypes.course, TagTypes.lesson],
    }),
    reorderedLessons: build.mutation({
      query: (lessonIds: string[]) => ({
        url: `${Route_URL}/order`,
        method: "PUT",
        data: { lessonIds },
      }),
      invalidatesTags: [TagTypes.course, TagTypes.lesson],
    }),

    // API for completed lessons
    getCompletedLessons: build.query({
      query: () => ({
        url: `${Route_URL}/completed`,
        method: "GET",
      }),
      providesTags: [TagTypes.completedLesson],
    }),
    addCompletedLesson: build.mutation({
      query: (lessonId: string) => ({
        url: `${Route_URL}/completed`,
        method: "POST",
        data: { lessonId },
      }),
      invalidatesTags: [TagTypes.completedLesson, TagTypes.lesson],
    }),
    getLessonLearning: build.query({
      query: (lessonId: string) => ({
        url: `${Route_URL}/${lessonId}/learning`,
        method: "GET",
      }),
      providesTags: [TagTypes.lessonLearning],
    }),
    saveLessonLearning: build.mutation({
      query: ({
        lessonId,
        body,
      }: {
        lessonId: string;
        body: {
          positionSeconds?: number;
          durationSeconds?: number;
          viewed?: boolean;
          note?: string;
          bookmarked?: boolean;
        };
      }) => ({
        url: `${Route_URL}/${lessonId}/learning`,
        method: "PUT",
        data: body,
      }),
      invalidatesTags: (_result, _error, { body }) =>
        body.note !== undefined || body.bookmarked !== undefined
          ? [TagTypes.lessonLearning]
          : [],
    }),
    getLessonQuiz: build.query({
      query: (lessonId: string) => ({
        url: `${Route_URL}/${lessonId}/quiz`,
        method: "GET",
      }),
      providesTags: [TagTypes.lessonQuiz],
    }),
    saveLessonQuiz: build.mutation({
      query: ({
        lessonId,
        body,
      }: {
        lessonId: string;
        body: {
          title: string;
          kind: "quiz" | "exam";
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
      }) => ({
        url: `${Route_URL}/${lessonId}/quiz`,
        method: "PUT",
        data: body,
      }),
      invalidatesTags: [TagTypes.lessonQuiz],
    }),
    submitLessonQuiz: build.mutation({
      query: ({
        lessonId,
        answers,
      }: {
        lessonId: string;
        answers: number[];
      }) => ({
        url: `${Route_URL}/${lessonId}/quiz`,
        method: "POST",
        data: { answers },
      }),
      invalidatesTags: [TagTypes.lessonQuiz],
    }),
    startQuizAttempt: build.mutation({
      query: (lessonId: string) => ({
        url: `${Route_URL}/${lessonId}/quiz/attempt`,
        method: "POST",
      }),
      invalidatesTags: [TagTypes.lessonQuiz],
    }),
    getQuizAttempt: build.query({
      query: ({
        lessonId,
        attemptId,
      }: {
        lessonId: string;
        attemptId: string;
      }) => ({
        url: `${Route_URL}/${lessonId}/quiz/attempt/${attemptId}`,
        method: "GET",
      }),
      providesTags: [TagTypes.lessonQuiz],
    }),
    saveQuizAttempt: build.mutation({
      query: ({
        lessonId,
        attemptId,
        responses,
      }: {
        lessonId: string;
        attemptId: string;
        responses: Record<
          string,
          { selectedOptions?: number[]; text?: string }
        >;
      }) => ({
        url: `${Route_URL}/${lessonId}/quiz/attempt/${attemptId}`,
        method: "PATCH",
        data: { responses },
      }),
    }),
    finishQuizAttempt: build.mutation({
      query: ({
        lessonId,
        attemptId,
        responses,
      }: {
        lessonId: string;
        attemptId: string;
        responses: Record<
          string,
          { selectedOptions?: number[]; text?: string }
        >;
      }) => ({
        url: `${Route_URL}/${lessonId}/quiz/attempt/${attemptId}`,
        method: "POST",
        data: { responses },
      }),
      invalidatesTags: [TagTypes.lessonQuiz],
    }),
    getPendingQuizAttempts: build.query({
      query: (lessonId: string) => ({
        url: `${Route_URL}/${lessonId}/quiz/attempts`,
        method: "GET",
      }),
      providesTags: [TagTypes.lessonQuiz],
    }),
    gradeQuizAttempt: build.mutation({
      query: ({
        lessonId,
        attemptId,
        scores,
        feedback,
      }: {
        lessonId: string;
        attemptId: string;
        scores: Record<string, number>;
        feedback: string;
      }) => ({
        url: `${Route_URL}/${lessonId}/quiz/attempts`,
        method: "PATCH",
        data: { attemptId, scores, feedback },
      }),
      invalidatesTags: [TagTypes.lessonQuiz],
    }),

    // API for previous lesson
    getPreviousLesson: build.query({
      query: ({
        courseId,
        lessonId,
        order,
        sectionId,
      }: {
        courseId: string;
        lessonId: string;
        order: number;
        sectionId: string;
      }) => ({
        url: `${Route_URL}/lesson/previous?courseId=${courseId}&lessonId=${lessonId}&order=${order}&sectionId=${sectionId}`,
        method: "GET",
      }),
      providesTags: [TagTypes.lesson, TagTypes.course],
    }),
    getNextLesson: build.query({
      query: ({
        courseId,
        lessonId,
        order,
        sectionId,
      }: {
        courseId: string;
        lessonId: string;
        order: number;
        sectionId: string;
      }) => ({
        url: `${Route_URL}/lesson/next?courseId=${courseId}&lessonId=${lessonId}&order=${order}&sectionId=${sectionId}`,
        method: "GET",
      }),
      providesTags: [TagTypes.lesson, TagTypes.course],
    }),
  }),
});

export const {
  useAddLessonMutation,
  useGetLessonsQuery,
  useGetLessonByIdQuery,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
  useReorderedLessonsMutation,
  useGetCompletedLessonsQuery,
  useAddCompletedLessonMutation,
  useGetLessonLearningQuery,
  useSaveLessonLearningMutation,
  useGetLessonQuizQuery,
  useSaveLessonQuizMutation,
  useSubmitLessonQuizMutation,
  useStartQuizAttemptMutation,
  useGetQuizAttemptQuery,
  useSaveQuizAttemptMutation,
  useFinishQuizAttemptMutation,
  useGetPendingQuizAttemptsQuery,
  useGradeQuizAttemptMutation,
  useGetPreviousLessonQuery,
  useGetNextLessonQuery,
} = LessonApi;
