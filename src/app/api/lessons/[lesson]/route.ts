/* eslint-disable @typescript-eslint/no-explicit-any */
import { CourseLessonStatus, PrismaClient } from "@prisma/client";
import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";
import { UserRole } from "@/constants/UserRole.constant";
import { authVerification } from "@/utils/authVerification";

const prisma = new PrismaClient();

export const PUT = authGuard(
  catchAsync(async (request: Request, context: any) => {
    const params = await context.params;
    const user = request.user;
    const lessonId = params.lesson;
    const { name, description, youtubeVideoId, status } = await request.json();

    // Check if user is authenticated or not
    if (user && user.role !== UserRole.admin) {
      return ApiError(401, "Unauthorized access!");
    }

    // Check if payload is valid or not
    if (
      !name ||
      !youtubeVideoId ||
      !status ||
      ![
        CourseLessonStatus.public,
        CourseLessonStatus.private,
        CourseLessonStatus.preview,
      ].includes(status)
    ) {
      return ApiError(400, "Invalid payload!");
    }

    // Check if section exists
    const isLessonExist = await prisma.courseLessons.findUnique({
      where: {
        id: lessonId,
      },
    });

    if (!isLessonExist) {
      return ApiError(404, "Not found!");
    }

    // Update a lesson
    const updatedLesson = await prisma.courseLessons.update({
      where: {
        id: lessonId,
      },
      data: {
        name: name || isLessonExist.name,
        description: description || isLessonExist.description || "",
        youtubeVideoId: youtubeVideoId || isLessonExist.youtubeVideoId || "",
        status: status || isLessonExist.status,
      },
    });

    if (!updatedLesson) {
      return ApiError(500, "Failed to update!");
    }

    return sendResponse({
      status: 200,
      message: "Updated successfully!",
      success: true,
      data: updatedLesson,
    });
  }),
);

export const DELETE = authGuard(
  catchAsync(async (request: Request, context: any) => {
    const params = await context.params;
    const user = request.user;
    const lessonId = params.lesson;

    // Check if user is authenticated or not
    if (user && user.role !== UserRole.admin) {
      return ApiError(401, "Unauthorized access!");
    }

    // Check if section exists
    const isLessonExist = await prisma.courseLessons.findUnique({
      where: {
        id: lessonId,
      },
    });

    if (!isLessonExist) {
      return ApiError(404, "Not found!");
    }

    // Delete a section
    const deletedSection = await prisma.courseLessons.delete({
      where: {
        id: lessonId,
      },
    });

    if (!deletedSection) {
      return ApiError(500, "Failed to delete!");
    }

    return sendResponse({
      status: 200,
      message: "Deleted successfully!",
      success: true,
      data: deletedSection,
    });
  }),
);

export const GET = catchAsync(async (request: Request, context: any) => {
  const params = await context.params;
  const lessonId = params.lesson;
  const courseId = new URLSearchParams(request.url.split("?")[1]).get(
    "courseId",
  );

  if (!courseId || !lessonId) {
    return ApiError(400, "Invalid request!");
  }

  // Get the Lesson
  const lesson = await prisma.courseLessons.findUnique({
    where: {
      id: lessonId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      youtubeVideoId: true,
      status: true,
      sectionId: true,
      order: true,
    },
  });

  if (!lesson) {
    return ApiError(404, "Lesson not found!");
  }

  //  --- If lesson is in preview mode, then response directly ---
  if (lesson.status === CourseLessonStatus.preview) {
    return sendResponse({
      status: 200,
      message: "Fetched successfully!",
      success: true,
      data: lesson,
    });
  }

  // --- If lesson is not in preview mode, then verify user access ---
  const authorization = await authVerification({
    authorization: request.headers.get("authorization") || "",
  });

  if (!authorization.success) {
    return ApiError(401, authorization.message || "Unauthorized access!");
  }

  const user = authorization.user;

  // Check if user is authenticated or not
  if (!user || !user.id || !user.email || !user.role || !courseId) {
    return ApiError(401, "Unauthorized access!");
  }

  // Check if lesson is completed or not
  const isLessonCompleted = await prisma.userLessonComplete.findFirst({
    where: {
      userId: user.id,
      lessonId,
    },
  });

  // --- If user's role is admin, then response directly ---
  if (user.role === UserRole.admin) {
    return sendResponse({
      status: 200,
      message: "Fetched successfully!",
      success: true,
      data: {
        ...lesson,
        isCompleted: isLessonCompleted ? true : false,
      },
    });
  }

  // --- If user's is general user, then verify have access or not ---

  if (
    user.role === UserRole.admin ||
    lesson.status === CourseLessonStatus.private
  ) {
    return ApiError(400, "Unauthorized access!");
  }

  // Check is user enrolled in the course or not
  const isEnrolled = await prisma.userCourseAccess.findFirst({
    where: {
      userId: user.id,
      courseId: courseId,
    },
  });

  if (!isEnrolled) {
    return ApiError(401, "Unauthorized access!");
  }

  // Check if course exists
  const course = await prisma.courses.findUnique({
    where: {
      id: courseId,
    },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!course) {
    return ApiError(404, "Course not found!");
  }

  // Check if lesson exists in the course
  const isLessonExist = course.sections
    .map((section) => section.lessons)
    .flat()
    .find((lesson) => lesson.id === lessonId);

  if (!isLessonExist) {
    return ApiError(404, "Lesson not found!");
  }

  return sendResponse({
    status: 200,
    message: "Fetched successfully!",
    success: true,
    data: {
      ...lesson,
      isCompleted: isLessonCompleted ? true : false,
    },
  });
});
