import { TagTypes } from "../tagTypes";
import { baseApi } from "./baseApi";

export const LearningApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMyBookmarks: build.query({
      query: () => ({
        url: "/learning/bookmarks",
        method: "GET",
      }),
      providesTags: [TagTypes.lessonLearning],
    }),
    removeBookmark: build.mutation({
      query: (lessonId: string) => ({
        url: "/learning/bookmarks",
        method: "DELETE",
        data: { lessonId },
      }),
      invalidatesTags: [TagTypes.lessonLearning],
    }),
    getMyGrades: build.query({
      query: () => ({
        url: "/learning/grades",
        method: "GET",
      }),
      providesTags: [TagTypes.lessonQuiz],
    }),
  }),
});

export const {
  useGetMyBookmarksQuery,
  useRemoveBookmarkMutation,
  useGetMyGradesQuery,
} = LearningApi;
