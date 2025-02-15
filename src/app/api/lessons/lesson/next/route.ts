import {
  CourseLessonStatus,
  CourseSectionStatus,
  PrismaClient,
  UserRole,
} from "@prisma/client";
import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";

const prisma = new PrismaClient();

export const GET = authGuard(
  catchAsync(async (request: Request) => {
    const user = request.user;

    const lessonId = new URLSearchParams(request.url.split("?")[1]).get(
      "lessonId",
    );
    // Get the order of the lesson from the query params and parse it to a number
    const order = new URLSearchParams(request.url.split("?")[1]).get("order");

    const sectionId = new URLSearchParams(request.url.split("?")[1]).get(
      "sectionId",
    );
    const courseId = new URLSearchParams(request.url.split("?")[1]).get(
      "courseId",
    );

    // Check if lessonId, sectionId, order and courseId are provided in the payload or not
    if (!lessonId || !sectionId || !order || !courseId) {
      return ApiError(400, "Invalid payload!");
    }

    // Check if user is authenticated or not
    if (!user || !user.role) {
      return ApiError(401, "Unauthorized access!");
    }

    if (user.role === UserRole.user) {
      const haveAccessToCourse = await prisma.userCourseAccess.findFirst({
        where: {
          courseId: courseId,
          userId: user.id,
        },
      });

      if (!haveAccessToCourse) {
        return ApiError(401, "Unauthorized access!");
      }
    }

    // Check if the lesson exists or not
    const lesson = await prisma.courseLessons.findFirst({
      where: {
        id: lessonId,
        sectionId: sectionId,
        order: parseInt(order),
      },
    });

    if (!lesson) {
      return ApiError(404, "Lesson not found!");
    }

    // get the next lesson
    const nextLesson = await prisma.courseLessons.findFirst({
      where: {
        sectionId: sectionId,
        status: {
          in: [CourseLessonStatus.public, CourseLessonStatus.preview],
        },
        order: {
          gt: parseInt(order),
        },
      },
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
      },
    });

    if (!nextLesson || nextLesson === null) {
      const section = await prisma.courseSections.findFirst({
        where: {
          id: lesson.sectionId,
        },
        select: {
          id: true,
          courseId: true,
          order: true,
        },
      });

      if (!section) {
        return ApiError(404, "Section not found!");
      }

      const nextSection = await prisma.courseSections.findFirst({
        where: {
          courseId: section.courseId,
          status: CourseSectionStatus.public,
          order: {
            gt: section.order,
          },
        },
        orderBy: {
          order: "asc",
        },
        select: {
          id: true,
        },
      });

      if (!nextSection) {
        return ApiError(404, "Next section not found!");
      }

      const nextLesson = await prisma.courseLessons.findFirst({
        where: {
          sectionId: nextSection?.id,
          status: {
            in: [CourseLessonStatus.public, CourseLessonStatus.preview],
          },
        },
        orderBy: {
          order: "asc",
        },
        select: {
          id: true,
        },
      });
      console.log(nextLesson);

      if (!nextLesson) {
        return ApiError(404, "Next lesson not found!");
      }

      return sendResponse({
        status: 200,
        message: "Next lesson found successfully!",
        success: true,
        data: {
          nextLessonId: nextLesson?.id,
          nextLessonSectionId: nextSection?.id,
        },
      });
    }

    return sendResponse({
      status: 200,
      message: "Next lesson found successfully!",
      success: true,
      data: {
        nextLessonId: nextLesson?.id,
        nextLessonSectionId: sectionId,
      },
    });
  }),
);
