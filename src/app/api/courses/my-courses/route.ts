import { CourseSectionStatus, PrismaClient } from "@prisma/client";
import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";

const prisma = new PrismaClient();

export const GET = authGuard(
  catchAsync(async (request: Request) => {
    const user = request.user;

    // Check if user is authenticated or not
    if (!user || !user.id || !user.email || !user.role) {
      return ApiError(401, "Unauthorized access!");
    }

    const isUserExist = await prisma.users.findUnique({
      where: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    if (!isUserExist) {
      return ApiError(401, "Unauthorized access!");
    }

    const userCourses = await prisma.userCourseAccess.findMany({
      where: { userId: user.id },
      include: {
        courses: {
          include: {
            sections: {
              where: {
                status: CourseSectionStatus.public,
              },
              include: {
                lessons: true,
              },
            },
          },
        },
      },
      orderBy: {
        courses: {
          name: "asc",
        },
      },
    });

    const userLessonComplete = await prisma.userLessonComplete.findMany({
      where: { userId: user.id },
    });

    const userLessonCompleteIds = userLessonComplete.map(
      (lesson) => lesson.lessonId,
    );

    const formattedData =
      userCourses.map((course) => {
        return {
          id: course.courses.id,
          name: course.courses.name,
          description: course.courses.description,
          sectionsCount: course.courses.sections.length,
          lessonsCount: course.courses.sections.reduce(
            (acc, section) => acc + section.lessons.length,
            0,
          ),
          lessonsComplete: userLessonCompleteIds.filter((lessonId) =>
            course.courses.sections
              .map((section) => section.lessons)
              .flat()
              .map((lesson) => lesson.id)
              .includes(lessonId),
          ).length,
        };
      }) || [];

    return sendResponse({
      status: 200,
      message: "User courses fetched successfully!",
      success: true,
      meta: {
        count: 0,
      },
      data: formattedData,
    });
  }),
);
