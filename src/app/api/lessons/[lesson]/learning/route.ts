import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/apiError";
import { authGuard } from "@/utils/authGuard";
import { catchAsync } from "@/utils/handleApi";
import { sendResponse } from "@/utils/sendResponse";
import { Prisma } from "@prisma/client";

const isUniqueConflict = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002";

const getLessonAccess = async (userId: string, lessonId: string) => {
  const lesson = await prisma.courseLessons.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      section: {
        select: {
          courseId: true,
        },
      },
    },
  });

  if (!lesson) {
    return null;
  }

  const access = await prisma.userCourseAccess.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: lesson.section.courseId,
      },
    },
  });

  return access ? lesson : null;
};

export const GET = authGuard(
  catchAsync(async (request: Request, context: unknown) => {
    const user = request.user;
    const { lesson: lessonId } = await (
      context as { params: Promise<{ lesson: string }> }
    ).params;

    if (!user || !lessonId) {
      return ApiError(401, "Unauthorized access!");
    }

    const lesson = await getLessonAccess(user.id, lessonId);
    if (!lesson) {
      return ApiError(403, "You do not have access to this lesson.");
    }

    const [progress, note, bookmark] = await Promise.all([
      prisma.userLessonProgress.findUnique({
        where: { userId_lessonId: { userId: user.id, lessonId } },
      }),
      prisma.lessonNotes.findUnique({
        where: { userId_lessonId: { userId: user.id, lessonId } },
      }),
      prisma.lessonBookmarks.findUnique({
        where: { userId_lessonId: { userId: user.id, lessonId } },
      }),
    ]);

    return sendResponse({
      status: 200,
      message: "Lesson learning data fetched successfully!",
      success: true,
      data: {
        positionSeconds: progress?.positionSeconds ?? 0,
        durationSeconds: progress?.durationSeconds ?? null,
        note: note?.content ?? "",
        bookmarked: Boolean(bookmark),
      },
    });
  }),
);

export const PUT = authGuard(
  catchAsync(async (request: Request, context: unknown) => {
    const user = request.user;
    const { lesson: lessonId } = await (
      context as { params: Promise<{ lesson: string }> }
    ).params;

    if (!user || !lessonId) {
      return ApiError(401, "Unauthorized access!");
    }

    const lesson = await getLessonAccess(user.id, lessonId);
    if (!lesson) {
      return ApiError(403, "You do not have access to this lesson.");
    }

    const body = await request.json();
    const positionSeconds =
      typeof body.positionSeconds === "number"
        ? Math.max(0, Math.floor(body.positionSeconds))
        : undefined;
    const durationSeconds =
      typeof body.durationSeconds === "number"
        ? Math.max(0, Math.floor(body.durationSeconds))
        : undefined;
    const note = typeof body.note === "string" ? body.note.trim() : undefined;
    const bookmarked =
      typeof body.bookmarked === "boolean" ? body.bookmarked : undefined;
    const viewed = body.viewed === true;

    await prisma.$transaction(async (transaction) => {
      if (positionSeconds !== undefined || viewed) {
        const progressData = {
          ...(positionSeconds !== undefined ? { positionSeconds } : {}),
          ...(durationSeconds !== undefined ? { durationSeconds } : {}),
          lastViewedAt: new Date(),
        };
        const updatedProgress = await transaction.userLessonProgress.updateMany({
          where: { userId: user.id, lessonId },
          data: progressData,
        });

        if (updatedProgress.count === 0) {
          try {
            await transaction.userLessonProgress.create({
              data: {
                userId: user.id,
                lessonId,
                positionSeconds: positionSeconds ?? 0,
                durationSeconds,
              },
            });
          } catch (error) {
            if (!isUniqueConflict(error)) throw error;
          }
        }
      }

      if (note !== undefined) {
        if (note.length === 0) {
          await transaction.lessonNotes.deleteMany({
            where: { userId: user.id, lessonId },
          });
        } else {
          const updatedNote = await transaction.lessonNotes.updateMany({
            where: { userId: user.id, lessonId },
            data: { content: note },
          });

          if (updatedNote.count === 0) {
            try {
              await transaction.lessonNotes.create({
                data: { userId: user.id, lessonId, content: note },
              });
            } catch (error) {
              if (!isUniqueConflict(error)) throw error;
            }
          }
        }
      }

      if (bookmarked !== undefined) {
        if (bookmarked) {
          const updatedBookmark = await transaction.lessonBookmarks.updateMany({
            where: { userId: user.id, lessonId },
            data: {},
          });

          if (updatedBookmark.count === 0) {
            try {
              await transaction.lessonBookmarks.create({
                data: { userId: user.id, lessonId },
              });
            } catch (error) {
              if (!isUniqueConflict(error)) throw error;
            }
          }
        } else {
          await transaction.lessonBookmarks.deleteMany({
            where: { userId: user.id, lessonId },
          });
        }
      }
    });

    return sendResponse({
      status: 200,
      message: "Learning progress saved!",
      success: true,
    });
  }),
);
