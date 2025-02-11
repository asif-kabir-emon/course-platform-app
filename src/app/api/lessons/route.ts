import { CourseLessonStatus, PrismaClient } from "@prisma/client";
import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";
import { UserRole } from "@/constants/UserRole.constant";

const prisma = new PrismaClient();

export const POST = authGuard(
  catchAsync(async (request: Request) => {
    const user = request.user;
    const { name, description, youtubeVideoId, status, sectionId } =
      await request.json();

    // Check if user is authenticated or not
    if (user && user.role !== UserRole.admin) {
      return ApiError(401, "Unauthorized access!");
    }

    // Check if name, courseId and status are provided in the payload or not
    if (
      !name ||
      !youtubeVideoId ||
      !sectionId ||
      !status ||
      ![
        CourseLessonStatus.public,
        CourseLessonStatus.private,
        CourseLessonStatus.preview,
      ].includes(status)
    ) {
      return ApiError(400, "Invalid payload!");
    }

    const totalExistingLessons = await prisma.courseLessons.count({
      where: {
        sectionId,
      },
    });

    if (totalExistingLessons > 0) {
      // reordering lessons based on the order
      const lessons = await prisma.courseLessons.findMany({
        where: {
          sectionId,
        },
        orderBy: {
          order: "asc",
        },
      });

      // Update the order of lessons
      await Promise.all(
        lessons.map(async (lesson, index) => {
          await prisma.courseLessons.update({
            where: { id: lesson.id },
            data: { order: index + 1 },
          });
        }),
      );
    }

    // Create a new section
    const newSection = await prisma.courseLessons.create({
      data: {
        name: name,
        description: description || "",
        youtubeVideoId: youtubeVideoId || "",
        status: status,
        sectionId: sectionId,
        order: totalExistingLessons + 1,
      },
    });

    if (!newSection) {
      return ApiError(500, "Failed to create lesson!");
    }

    return sendResponse({
      status: 200,
      message: "New lesson added successfully!",
      success: true,
      data: newSection,
    });
  }),
);
