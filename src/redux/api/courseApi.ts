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
      query: ({
        paginate = false,
        page = 1,
        pageSize = 10,
        search = "",
      }: {
        paginate?: boolean;
        page?: number;
        pageSize?: number;
        search?: string;
      }) => ({
        url: `${Route_URL}?paginate=${paginate}&page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`,
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
    getCourseReviews: build.query({
      query: (courseId: string) => ({
        url: `${Route_URL}/${courseId}/reviews`,
        method: "GET",
      }),
      providesTags: [TagTypes.courseReview],
    }),
    saveCourseReview: build.mutation({
      query: ({
        courseId,
        rating,
        comment,
      }: {
        courseId: string;
        rating: number;
        comment?: string;
      }) => ({
        url: `${Route_URL}/${courseId}/reviews`,
        method: "PUT",
        data: { rating, comment },
      }),
      invalidatesTags: [TagTypes.courseReview],
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
  useGetCourseReviewsQuery,
  useSaveCourseReviewMutation,
} = CourseApi;
