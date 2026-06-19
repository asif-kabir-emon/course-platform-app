"use client";

import { useApiMutation, useApiQuery } from "@/helpers/tanstack/api";
import {
  courseService,
  type CourseReviewBody,
  type CoursesQueryArgs,
} from "@/service/course.service";

const courseKeys = {
  all: ["courses"] as const,
  list: (params: unknown) => ["courses", params] as const,
  detail: (id: string) => ["courses", id] as const,
  mine: ["courses", "my-courses"] as const,
  reviews: (courseId: string) => ["courses", courseId, "reviews"] as const,
};

export const useGetCoursesQuery = (args: CoursesQueryArgs = {}) => {
  return useApiQuery(
    courseKeys.list(args),
    () => courseService.getCourses(args),
    { keepPreviousData: true },
  );
};

export const useGetCourseByIdQuery = (id: string) =>
  useApiQuery(courseKeys.detail(id), () => courseService.getCourseById(id), {
    skip: !id,
  });

export const useGetMyCoursesQuery = (
  _args?: unknown,
  options?: {
    refetchOnFocus?: boolean;
    refetchOnMountOrArgChange?: boolean;
    skip?: boolean;
  },
) => useApiQuery(courseKeys.mine, courseService.getMyCourses, options);

export const useGetCourseReviewsQuery = (courseId: string) =>
  useApiQuery(
    courseKeys.reviews(courseId),
    () => courseService.getCourseReviews(courseId),
    { skip: !courseId },
  );

export const useAddCourseMutation = () =>
  useApiMutation({
    mutationFn: courseService.addCourse,
    invalidateKeys: [courseKeys.all],
  });

export const useUpdateCourseMutation = () =>
  useApiMutation({
    mutationFn: courseService.updateCourse,
    invalidateKeys: [courseKeys.all, courseKeys.mine],
  });

export const useDeleteCourseMutation = () =>
  useApiMutation({
    mutationFn: courseService.deleteCourse,
    invalidateKeys: [courseKeys.all, courseKeys.mine],
  });

export const useSaveCourseReviewMutation = () =>
  useApiMutation<CourseReviewBody>({
    mutationFn: courseService.saveCourseReview,
    getInvalidateKeys: ({ courseId }) => [
      courseKeys.reviews(courseId),
      courseKeys.detail(courseId),
    ],
  });
