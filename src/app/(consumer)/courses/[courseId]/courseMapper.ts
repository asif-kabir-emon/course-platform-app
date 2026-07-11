type CourseSection = {
  id: string;
  name: string;
  lessons: {
    id: string;
    name: string;
    type?: "video" | "text" | "quiz";
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
  const completedLessonIdSet = new Set(completedLessonIds);

  return {
    ...course,
    sections: course.sections.map((section) => {
      const lessons = section.lessons.map((lesson) => ({
        ...lesson,
        isComplete: completedLessonIdSet.has(lesson.id),
      }));
      const completedLessonsCount = lessons.filter(
        (lesson) => lesson.isComplete,
      ).length;

      return {
        ...section,
        lessons,
        completedLessonsCount,
        isComplete:
          lessons.length > 0 && completedLessonsCount === lessons.length,
      };
    }),
  };
};
