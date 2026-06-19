import { apiClient } from "./api-client";

const ROUTE_URL = "/courses";

export type CoursesQueryArgs = {
  paginate?: boolean;
  page?: number;
  pageSize?: number;
  search?: string;
};

export type CourseReviewBody = {
  courseId: string;
  rating: number;
  comment?: string;
};

export const courseService = {
  getCourses: (args: CoursesQueryArgs = {}) => {
    const { paginate = false, page = 1, pageSize = 10, search = "" } = args;

    return apiClient(
      `${ROUTE_URL}?paginate=${paginate}&page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`,
    );
  },
  getCourseById: (id: string) => apiClient(`${ROUTE_URL}/${id}`),
  getMyCourses: () => apiClient(`${ROUTE_URL}/my-courses`),
  getCourseReviews: (courseId: string) =>
    apiClient(`${ROUTE_URL}/${courseId}/reviews`),
  addCourse: (data: unknown) =>
    apiClient(ROUTE_URL, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCourse: ({ id, body }: { id: string; body: unknown }) =>
    apiClient(`${ROUTE_URL}/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteCourse: (id: string) =>
    apiClient(`${ROUTE_URL}/${id}`, {
      method: "DELETE",
    }),
  saveCourseReview: ({ courseId, rating, comment }: CourseReviewBody) =>
    apiClient(`${ROUTE_URL}/${courseId}/reviews`, {
      method: "PUT",
      body: JSON.stringify({ rating, comment }),
    }),
};
