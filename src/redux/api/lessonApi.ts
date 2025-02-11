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
      query: (id: string) => ({
        url: `${Route_URL}/${id}`,
        method: "GET",
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
  }),
});

export const {
  useAddLessonMutation,
  useGetLessonsQuery,
  useGetLessonByIdQuery,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
  useReorderedLessonsMutation,
} = LessonApi;
