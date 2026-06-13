import { CourseLessonStatus } from "@/constants/CourseLessonStatus.constant";
import { prisma } from "@/lib/prisma";
import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";
import { isAdminRole } from "@/constants/UserRole.constant";
import { CourseLessonType } from "@/constants/CourseLessonType.constant";


export const POST = authGuard(
  catchAsync(async (request: Request) => {
    const user = request.user;
    const { name, description, type, content, youtubeVideoId, status, sectionId } =
      await request.json();
    const lessonType = Object.values(CourseLessonType).includes(type)
      ? type
      : CourseLessonType.video;

    // Check if user is authenticated or not
    if (user && !isAdminRole(user.role)) {
      return ApiError(401, "Unauthorized access!");
    }

    // Check if name, courseId and status are provided in the payload or not
    if (
      !name ||
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
    if (lessonType === CourseLessonType.video && !youtubeVideoId?.trim()) {
      return ApiError(400, "A YouTube video ID is required.");
    }
    if (lessonType === CourseLessonType.text && !content?.trim()) {
      return ApiError(400, "Text lesson content is required.");
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
        type: lessonType,
        content: lessonType === CourseLessonType.text ? content.trim() : "",
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
