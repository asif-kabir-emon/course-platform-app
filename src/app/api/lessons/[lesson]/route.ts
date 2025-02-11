import { CourseLessonStatus, PrismaClient } from "@prisma/client";
import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";
import { UserRole } from "@/constants/UserRole.constant";

const prisma = new PrismaClient();

export const PUT = authGuard(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
