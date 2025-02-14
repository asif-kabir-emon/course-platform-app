import { TagTypes } from "../tagTypes";
import { baseApi } from "./baseApi";
const Route_URL = "/courses";

export const CourseApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    addCourse: build.mutation({
      query: (data) => ({
        url: `${Route_URL}`,
        method: "POST",
        data: data,
      }),
      invalidatesTags: [TagTypes.course],
    }),
    getCourses: build.query({
      query: () => ({
        url: `${Route_URL}`,
        method: "GET",
      }),
      providesTags: [TagTypes.course],
    }),
    getCourseById: build.query({
      query: (id: string) => ({
        url: `${Route_URL}/${id}`,
        method: "GET",
      }),
      providesTags: [TagTypes.course],
    }),
    getMyCourses: build.query({
      query: () => ({
        url: `${Route_URL}/my-courses`,
        method: "GET",
      }),
      providesTags: [TagTypes.course],
    }),
    updateCourse: build.mutation({
      query: ({ id, body }) => ({
        url: `${Route_URL}/${id}`,
        method: "PUT",
        data: body,
      }),
      invalidatesTags: [TagTypes.course],
    }),
    deleteCourse: build.mutation({
      query: (id: string) => ({
        url: `${Route_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [TagTypes.course],
    }),
  }),
});

export const {
  useAddCourseMutation,
  useGetCoursesQuery,
  useGetCourseByIdQuery,
  useGetMyCoursesQuery,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
} = CourseApi;
