import { PrismaClient } from "@prisma/client";
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

    // Get all completed lessons
    const completedLessons = await prisma.userLessonComplete.findMany({
      where: {
        userId: user.id,
      },
    });

    const completedLessonIds =
      completedLessons.map((lesson) => lesson.lessonId) || [];

    return sendResponse({
      status: 200,
      message: "Course fetched successfully!",
      success: true,
      data: completedLessonIds,
    });
  }),
);

export const POST = authGuard(
  catchAsync(async (request: Request) => {
    const user = request.user;
    const { lessonId } = await request.json();

    // Check if user is authenticated or not
    if (!user || !user.id || !user.email || !user.role || !lessonId) {
      return ApiError(401, "Unauthorized access!");
    }

    // Create a new completed lesson
    const newCompletedLesson = await prisma.userLessonComplete.create({
      data: {
        lessonId: lessonId,
        userId: user.id,
      },
    });

    if (!newCompletedLesson) {
      return ApiError(400, "Failed to mark lesson as completed!");
    }

    return sendResponse({
      status: 200,
      message: "Lesson marked as completed!",
      success: true,
      data: newCompletedLesson,
    });
  }),
);
