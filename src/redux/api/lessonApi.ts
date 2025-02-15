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
  useGetPreviousLessonQuery,
  useGetNextLessonQuery,
} = LessonApi;
