export const CourseSectionStatus = {
  public: "public",
  private: "private",
} as const;

export type CourseSectionStatus =
  (typeof CourseSectionStatus)[keyof typeof CourseSectionStatus];
