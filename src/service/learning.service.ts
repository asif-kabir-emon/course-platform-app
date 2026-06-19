import { apiClient } from "./api-client";

export const learningService = {
  getMyBookmarks: () => apiClient("/learning/bookmarks"),
  removeBookmark: (lessonId: string) =>
    apiClient("/learning/bookmarks", {
      method: "DELETE",
      body: JSON.stringify({ lessonId }),
    }),
  getMyGrades: () => apiClient("/learning/grades"),
};
