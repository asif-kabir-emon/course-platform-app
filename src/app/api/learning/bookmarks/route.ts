import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/apiError";
import { authGuard } from "@/utils/authGuard";
import { catchAsync } from "@/utils/handleApi";
import { sendResponse } from "@/utils/sendResponse";

export const GET = authGuard(
  catchAsync(async (request: Request) => {
    const user = request.user;
    if (!user) return ApiError(401, "Unauthorized access.");

    const bookmarks = await prisma.lessonBookmarks.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        lesson: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            section: {
              select: {
                id: true,
                name: true,
                courses: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return sendResponse({
      status: 200,
      success: true,
      message: "Bookmarks fetched successfully.",
      data: bookmarks.map((bookmark) => ({
        id: bookmark.id,
        createdAt: bookmark.createdAt,
        lesson: {
          id: bookmark.lesson.id,
          name: bookmark.lesson.name,
          type: bookmark.lesson.type,
          description: bookmark.lesson.description,
          sectionId: bookmark.lesson.section.id,
          sectionName: bookmark.lesson.section.name,
          courseId: bookmark.lesson.section.courses.id,
          courseName: bookmark.lesson.section.courses.name,
        },
      })),
    });
  }),
);

export const DELETE = authGuard(
  catchAsync(async (request: Request) => {
    const user = request.user;
    const { lessonId } = await request.json();

    if (!user) return ApiError(401, "Unauthorized access.");
    if (typeof lessonId !== "string" || !lessonId) {
      return ApiError(400, "Lesson ID is required.");
    }

    await prisma.lessonBookmarks.deleteMany({
      where: { userId: user.id, lessonId },
    });

    return sendResponse({
      status: 200,
      success: true,
      message: "Bookmark removed.",
    });
  }),
);
