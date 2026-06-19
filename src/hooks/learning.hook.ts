"use client";

import { useApiMutation, useApiQuery } from "@/helpers/tanstack/api";
import { learningService } from "@/service/learning.service";

const learningKeys = {
  bookmarks: ["learning", "bookmarks"] as const,
  grades: ["learning", "grades"] as const,
  lessons: ["lessons"] as const,
};

export const useGetMyBookmarksQuery = (args?: unknown) => {
  void args;
  return useApiQuery(learningKeys.bookmarks, learningService.getMyBookmarks);
};

export const useRemoveBookmarkMutation = () =>
  useApiMutation({
    mutationFn: learningService.removeBookmark,
    invalidateKeys: [learningKeys.bookmarks, learningKeys.lessons],
  });

export const useGetMyGradesQuery = (args?: unknown) => {
  void args;
  return useApiQuery(learningKeys.grades, learningService.getMyGrades);
};
