import { CourseSectionStatus } from "@/constants/CourseSectionStatus.constant";
import { prisma } from "@/lib/prisma";
import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";
import { isAdminRole } from "@/constants/UserRole.constant";


export const POST = authGuard(
  catchAsync(async (request: Request) => {
    const user = request.user;
    const { name, courseId, status } = await request.json();

    // Check if user is authenticated or not
    if (user && !isAdminRole(user.role)) {
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

    const totalExistingSections = await prisma.courseSections.count({
      where: {
        courseId,
      },
    });

    if (totalExistingSections > 0) {
      // reordering sections based on the order
      const sections = await prisma.courseSections.findMany({
        where: {
          courseId,
        },
        orderBy: {
          order: "asc",
        },
      });

      // Update the order of sections
      await Promise.all(
        sections.map(async (section, index) => {
          await prisma.courseSections.update({
            where: { id: section.id },
            data: { order: index + 1 },
          });
        }),
      );
    }

    // Create a new section
    const newSection = await prisma.courseSections.create({
      data: {
        name,
        courseId,
        status,
        order: totalExistingSections + 1,
      },
    });

    if (!newSection) {
      return ApiError(500, "Failed to create section!");
    }

    return sendResponse({
      status: 200,
      message: "New section added successfully!",
      success: true,
      data: newSection,
    });
  }),
);
