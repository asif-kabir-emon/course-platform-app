import { PrismaClient } from "@prisma/client";
import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";
import { UserRole } from "@/constants/UserRole.constant";

const prisma = new PrismaClient();

export const PUT = authGuard(
  catchAsync(async (request: Request) => {
    const user = request.user;
    const { lessonIds } = await request.json();

    // Check if user is authenticated or not
    if (user && user.role !== UserRole.admin) {
      return ApiError(401, "Unauthorized access!");
    }

    // Check if lessonIds is provided in the payload or not and it is an array
    if (!lessonIds || !Array.isArray(lessonIds) || lessonIds.length === 0) {
      return ApiError(400, "Invalid payload!");
    }

    // Update the order of lessons
    const reorderedLessons = await Promise.all(
      lessonIds.map(async (lessonId, index) => {
        const lesson = await prisma.courseLessons.update({
          where: { id: lessonId },
          data: { order: index + 1 },
        });

        return {
          sectionId: lesson.sectionId,
          lessonId: lesson.id,
        };
      }),
    );

    if (!reorderedLessons || reorderedLessons.length === 0) {
      return ApiError(500, "Failed to reorder lessons!");
    }

    return sendResponse({
      status: 200,
      message: "Lessons reordered successfully!",
      success: true,
      data: reorderedLessons,
    });
  }),
);
