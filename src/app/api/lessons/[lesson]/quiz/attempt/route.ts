import { isAdminRole } from "@/constants/UserRole.constant";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/apiError";
import { authGuard } from "@/utils/authGuard";
import { catchAsync } from "@/utils/handleApi";
import { sendResponse } from "@/utils/sendResponse";

const hasCourseAccess = async (userId: string, courseId: string) =>
  Boolean(
    await prisma.userCourseAccess.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true },
    }),
  );

export const POST = authGuard(
  catchAsync(async (request: Request, context: unknown) => {
    const user = request.user;
    const { lesson: lessonId } = await (
      context as { params: Promise<{ lesson: string }> }
    ).params;

    if (!user) return ApiError(401, "Unauthorized access.");
    if (isAdminRole(user.role)) {
      return ApiError(403, "Admin preview does not create attempts.");
    }

    const lesson = await prisma.courseLessons.findUnique({
      where: { id: lessonId },
      select: {
        section: { select: { courseId: true } },
        quiz: {
          include: {
            questions: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (
      !lesson ||
      !(await hasCourseAccess(user.id, lesson.section.courseId))
    ) {
      return ApiError(403, "You do not have access to this lesson.");
    }

    const quiz = lesson.quiz;
    if (!quiz?.isPublished || quiz.questions.length === 0) {
      return ApiError(404, "No published quiz or exam is available.");
    }

    const now = new Date();
    if (quiz.availableFrom && now < quiz.availableFrom) {
      return ApiError(403, "This attempt window has not opened yet.");
    }
    if (quiz.availableUntil && now >= quiz.availableUntil) {
      return ApiError(403, "This attempt window has closed.");
    }

    const activeAttempt = await prisma.quizAttempts.findFirst({
      where: {
        quizId: quiz.id,
        userId: user.id,
        status: "in_progress",
      },
      orderBy: { startedAt: "desc" },
    });

    if (
      activeAttempt &&
      (!activeAttempt.expiresAt || activeAttempt.expiresAt > now)
    ) {
      return sendResponse({
        status: 200,
        success: true,
        message: "Your active attempt was resumed.",
        data: {
          attemptId: activeAttempt.id,
          expiresAt: activeAttempt.expiresAt,
          resumed: true,
        },
      });
    }

    if (activeAttempt) {
      await prisma.quizAttempts.update({
        where: { id: activeAttempt.id },
        data: {
          status: "timed_out",
          submittedAt: activeAttempt.expiresAt ?? now,
        },
      });
    }

    const attemptCount = await prisma.quizAttempts.count({
      where: { quizId: quiz.id, userId: user.id },
    });
    if (quiz.maxAttempts !== null && attemptCount >= quiz.maxAttempts) {
      return ApiError(403, "You have used all available attempts.");
    }

    const timeLimitEnd = quiz.timeLimitMinutes
      ? new Date(now.getTime() + quiz.timeLimitMinutes * 60_000)
      : null;
    const expiresAt =
      timeLimitEnd && quiz.availableUntil
        ? new Date(Math.min(timeLimitEnd.getTime(), quiz.availableUntil.getTime()))
        : timeLimitEnd ?? quiz.availableUntil;
    const totalPoints = quiz.questions.reduce(
      (total, question) => total + question.points,
      0,
    );

    const attempt = await prisma.quizAttempts.create({
      data: {
        quizId: quiz.id,
        userId: user.id,
        status: "in_progress",
        score: 0,
        passed: false,
        answers: [],
        responses: {},
        earnedPoints: 0,
        totalPoints,
        startedAt: now,
        expiresAt,
      },
    });

    return sendResponse({
      status: 201,
      success: true,
      message: `${quiz.kind === "exam" ? "Exam" : "Quiz"} attempt started.`,
      data: {
        attemptId: attempt.id,
        expiresAt: attempt.expiresAt,
        resumed: false,
      },
    });
  }),
);
