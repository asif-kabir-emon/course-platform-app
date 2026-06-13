/* eslint-disable @typescript-eslint/no-explicit-any */
import { CourseLessonStatus } from "@/constants/CourseLessonStatus.constant";
import { prisma } from "@/lib/prisma";
import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";
import { isAdminRole } from "@/constants/UserRole.constant";
import { authVerification } from "@/utils/authVerification";
import { CourseLessonType } from "@/constants/CourseLessonType.constant";


export const PUT = authGuard(
  catchAsync(async (request: Request, context: any) => {
    const params = await context.params;
    const user = request.user;
    const lessonId = params.lesson;
    const { name, description, type, content, youtubeVideoId, status } =
      await request.json();

    // Check if user is authenticated or not
    if (user && !isAdminRole(user.role)) {
      return ApiError(401, "Unauthorized access!");
    }

    // Check if payload is valid or not
    if (
      !name ||
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
    const lessonType = isLessonExist.type;
    if (type && type !== lessonType) {
      return ApiError(
        400,
        "Lesson type cannot be changed after the lesson is created.",
      );
    }
    if (lessonType === CourseLessonType.video && !youtubeVideoId?.trim()) {
      return ApiError(400, "A YouTube video ID is required.");
    }
    if (lessonType === CourseLessonType.text && !content?.trim()) {
      return ApiError(400, "Text lesson content is required.");
    }

    // Update a lesson
    const updatedLesson = await prisma.courseLessons.update({
      where: {
        id: lessonId,
      },
      data: {
        name: name || isLessonExist.name,
        description: description || isLessonExist.description || "",
        type: lessonType,
        content: lessonType === CourseLessonType.text ? content.trim() : "",
        youtubeVideoId:
          lessonType === CourseLessonType.video ? youtubeVideoId.trim() : "",
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
    if (user && !isAdminRole(user.role)) {
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
      type: true,
      content: true,
      youtubeVideoId: true,
      status: true,
      sectionId: true,
      order: true,
    },
  });

  if (!lesson) {
    return ApiError(404, "Lesson not found!");
  }

  const authorization = await authVerification({
    authorization: request.headers.get("authorization") || "",
  });

  const user = authorization.user;
  const isAdmin = isAdminRole(user?.role);

  let hasAccess = isAdmin;
  if (user) {
    if (!isAdmin) {
      const hasAccessToCourse = await prisma.userCourseAccess.findFirst({
        where: {
          userId: user.id,
          courseId,
        },
      });

      hasAccess = Boolean(hasAccessToCourse);
    }
  }

  //  --- If lesson is in preview mode and don't have access to course, then response directly ---
  if (
    (!user || user) &&
    lesson.status === CourseLessonStatus.preview &&
    !hasAccess
  ) {
    return sendResponse({
      status: 200,
      message: "Fetched successfully!",
      success: true,
      data: {
        ...lesson,
        hasAccess,
      },
    });
  }

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

  if (!isAdmin && lesson.status === CourseLessonStatus.private) {
    return ApiError(400, "Unauthorized access!");
  }

  // Check is user enrolled in the course or not
  const isEnrolled = await prisma.userCourseAccess.findFirst({
    where: {
      userId: user.id,
      courseId: courseId,
    },
  });

  if (!isAdmin && !isEnrolled) {
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
      hasAccess: Boolean(hasAccess),
      isAdminPreview: isAdmin,
    },
  });
});
