import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/apiError";
import { authGuard } from "@/utils/authGuard";
import { catchAsync } from "@/utils/handleApi";
import { sendResponse } from "@/utils/sendResponse";

const parseNumberRecord = (value: Prisma.JsonValue | null) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.entries(value).reduce<Record<string, number>>(
    (result, [key, rawValue]) => {
      const number = Number(rawValue);
      if (Number.isFinite(number)) result[key] = number;
      return result;
    },
    {},
  );
};

export const GET = authGuard(
  catchAsync(async (request: Request) => {
    const user = request.user;
    if (!user) return ApiError(401, "Unauthorized access.");

    const attempts = await prisma.quizAttempts.findMany({
      where: {
        userId: user.id,
        status: {
          in: ["submitted", "timed_out", "pending_review", "graded"],
        },
      },
      orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
      include: {
        quiz: {
          include: {
            lesson: {
              select: {
                id: true,
                name: true,
                section: {
                  select: {
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
            questions: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                prompt: true,
                type: true,
                points: true,
              },
            },
          },
        },
      },
    });

    const gradedAttempts = attempts.filter(
      (attempt) => attempt.status === "graded",
    );
    const averageScore =
      gradedAttempts.length > 0
        ? Math.round(
            gradedAttempts.reduce(
              (total, attempt) => total + attempt.score,
              0,
            ) / gradedAttempts.length,
          )
        : null;

    return sendResponse({
      status: 200,
      success: true,
      message: "Grades fetched successfully.",
      data: {
        summary: {
          totalAttempts: attempts.length,
          gradedAttempts: gradedAttempts.length,
          pendingReview: attempts.filter(
            (attempt) => attempt.status === "pending_review",
          ).length,
          passedAttempts: gradedAttempts.filter((attempt) => attempt.passed)
            .length,
          averageScore,
        },
        attempts: attempts.map((attempt) => {
          const grading = parseNumberRecord(attempt.grading);

          return {
            id: attempt.id,
            status: attempt.status,
            score: attempt.score,
            passed: attempt.passed,
            earnedPoints: attempt.earnedPoints,
            totalPoints: attempt.totalPoints,
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt,
            gradedAt: attempt.gradedAt,
            feedback: attempt.feedback,
            assessment: {
              title: attempt.quiz.title,
              kind: attempt.quiz.kind,
              passingScore: attempt.quiz.passingScore,
              isGradable: attempt.quiz.isGradable,
            },
            lesson: {
              id: attempt.quiz.lesson.id,
              name: attempt.quiz.lesson.name,
            },
            course: {
              id: attempt.quiz.lesson.section.courses.id,
              name: attempt.quiz.lesson.section.courses.name,
            },
            manualGrades: attempt.quiz.questions
              .filter((question) => question.type === "long_answer")
              .map((question) => ({
                questionId: question.id,
                prompt: question.prompt,
                earnedPoints: grading[question.id] ?? null,
                possiblePoints: question.points,
              })),
          };
        }),
      },
    });
  }),
);
