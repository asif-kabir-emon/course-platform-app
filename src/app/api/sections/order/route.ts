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
    const { sectionIds } = await request.json();

    // Check if user is authenticated or not
    if (user && user.role !== UserRole.admin) {
      return ApiError(401, "Unauthorized access!");
    }

    // Check if sectionIds is provided in the payload or not and it is an array
    if (!sectionIds || !Array.isArray(sectionIds) || sectionIds.length === 0) {
      return ApiError(400, "Invalid payload!");
    }

    // Update the order of sections
    const reorderedSections = await Promise.all(
      sectionIds.map(async (sectionId, index) => {
        const section = await prisma.courseSections.update({
          where: { id: sectionId },
          data: { order: index + 1 },
        });

        return {
          courseId: section.courseId,
          id: section.id,
        };
      }),
    );

    if (!reorderedSections || reorderedSections.length === 0) {
      return ApiError(500, "Failed to reorder sections!");
    }

    return sendResponse({
      status: 200,
      message: "Sections reordered successfully!",
      success: true,
      data: reorderedSections,
    });
  }),
);
