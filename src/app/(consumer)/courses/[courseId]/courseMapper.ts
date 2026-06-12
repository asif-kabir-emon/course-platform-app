type CourseSection = {
  id: string;
  name: string;
  lessons: {
    id: string;
    name: string;
  }[];
};

type CourseWithSections = {
  id: string;
  name: string;
  sections: CourseSection[];
};

export const mapCourse = ({
  course,
  completedLessonIds,
}: {
  course: CourseWithSections;
  completedLessonIds: string[];
}) => {
  return {
    ...course,
    sections: course.sections.map((section) => ({
      ...section,
      lessons: section.lessons.map((lesson) => ({
        ...lesson,
        isComplete: completedLessonIds.includes(lesson.id),
      })),
    })),
  };
};
