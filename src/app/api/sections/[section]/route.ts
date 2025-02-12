import { CourseSectionStatus, PrismaClient } from "@prisma/client";
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
    const sectionId = params.section;
    const { name, courseId, status } = await request.json();

    // Check if user is authenticated or not
    if (user && user.role !== UserRole.admin) {
      return ApiError(401, "Unauthorized access!");
    }

    // Check if name, courseId and status are provided in the payload or not
    if (
      !name ||
      !courseId ||
      !status ||
      ![CourseSectionStatus.public, CourseSectionStatus.private].includes(
        status,
      )
    ) {
      return ApiError(400, "Invalid payload!");
    }

    // Check if section exists
    const isSectionExist = await prisma.courseSections.findUnique({
      where: {
        id: sectionId,
      },
    });

    if (!isSectionExist) {
      return ApiError(404, "Not found!");
    }

    // Create a new section
    const updatedSection = await prisma.courseSections.update({
      where: {
        id: sectionId,
      },
      data: {
        name: name,
        status: status,
      },
    });

    if (!updatedSection) {
      return ApiError(500, "Failed to update section!");
    }

    return sendResponse({
      status: 200,
      message: "New section updated successfully!",
      success: true,
      data: updatedSection,
    });
  }),
);

export const DELETE = authGuard(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catchAsync(async (request: Request, context: any) => {
    const params = await context.params;
    const user = request.user;
    const sectionId = params.section;

    // Check if user is authenticated or not
    if (user && user.role !== UserRole.admin) {
      return ApiError(401, "Unauthorized access!");
    }

    // Check if section exists
    const isSectionExist = await prisma.courseSections.findUnique({
      where: {
        id: sectionId,
      },
      include: {
        lessons: true,
      },
    });

    if (!isSectionExist) {
      return ApiError(404, "Not found!");
    }

    if (isSectionExist.lessons.length > 0) {
      return ApiError(400, "Section has lessons. Please delete them first!");
    }

    // Delete a section
    const deletedSection = await prisma.courseSections.delete({
      where: {
        id: sectionId,
      },
    });

    if (!deletedSection) {
      return ApiError(500, "Failed to delete section!");
    }

    return sendResponse({
      status: 200,
      message: "Section deleted successfully!",
      success: true,
      data: deletedSection,
    });
  }),
);
