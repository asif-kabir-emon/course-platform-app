export const CourseLessonStatus = {
  public: "public",
  private: "private",
  preview: "preview",
} as const;

export type CourseLessonStatus =
  (typeof CourseLessonStatus)[keyof typeof CourseLessonStatus];
