import { Prisma } from "@prisma/client";
import { isAdminRole } from "@/constants/UserRole.constant";
import { gradeQuizResponses } from "@/lib/quiz";
import { prisma } from "@/lib/prisma";
import type { QuizQuestionType, QuizResponses } from "@/types/quiz";
import { ApiError } from "@/utils/apiError";
import { authGuard } from "@/utils/authGuard";
import { catchAsync } from "@/utils/handleApi";
import { sendResponse } from "@/utils/sendResponse";

const parseResponses = (value: Prisma.JsonValue | null): QuizResponses =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as QuizResponses)
    : {};

export const GET = authGuard(
  catchAsync(async (request: Request, context: unknown) => {
    const user = request.user;
    const { lesson: lessonId } = await (
      context as { params: Promise<{ lesson: string }> }
    ).params;

    if (!user || !isAdminRole(user.role)) {
      return ApiError(403, "Admin access is required.");
    }

    const quiz = await prisma.lessonQuizzes.findUnique({
      where: { lessonId },
      include: {
        questions: { orderBy: { order: "asc" } },
        attempts: {
          where: { status: "pending_review" },
          orderBy: { submittedAt: "asc" },
          include: {
            user: {
              select: {
                email: true,
                profile: {
                  select: { firstName: true, lastName: true },
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
      message: "Pending grading attempts fetched.",
      data:
        quiz?.attempts.map((attempt) => ({
          id: attempt.id,
          learnerName:
            [attempt.user.profile?.firstName, attempt.user.profile?.lastName]
              .filter(Boolean)
              .join(" ") || attempt.user.email,
          learnerEmail: attempt.user.email,
          submittedAt: attempt.submittedAt,
          responses: parseResponses(attempt.responses),
          questions: quiz.questions.map((question) => ({
            id: question.id,
            prompt: question.prompt,
            type: question.type,
            points: question.points,
          })),
        })) ?? [],
    });
  }),
);

export const PATCH = authGuard(
  catchAsync(async (request: Request, context: unknown) => {
    const user = request.user;
    const { lesson: lessonId } = await (
      context as { params: Promise<{ lesson: string }> }
    ).params;
    const body = await request.json();

    if (!user || !isAdminRole(user.role)) {
      return ApiError(403, "Admin access is required.");
    }

    const attemptId =
      typeof body.attemptId === "string" ? body.attemptId : "";
    const attempt = await prisma.quizAttempts.findFirst({
      where: {
        id: attemptId,
        status: "pending_review",
        quiz: { lessonId },
      },
      include: {
        quiz: {
          include: { questions: { orderBy: { order: "asc" } } },
        },
      },
    });

    if (!attempt) return ApiError(404, "Pending attempt not found.");

    const responses = parseResponses(attempt.responses);
    const automatic = gradeQuizResponses(
      attempt.quiz.questions.map((question) => ({
        id: question.id,
        type: question.type as QuizQuestionType,
        correctOption: question.correctOption,
        correctOptions:
          question.correctOptions.length > 0
            ? question.correctOptions
            : [question.correctOption],
        acceptedAnswers: question.acceptedAnswers,
        caseSensitive: question.caseSensitive,
        points: question.points,
      })),
      responses,
    );
    const rawScores =
      body.scores && typeof body.scores === "object" && !Array.isArray(body.scores)
        ? (body.scores as Record<string, unknown>)
        : {};
    const manualScores = attempt.quiz.questions.reduce<Record<string, number>>(
      (scores, question) => {
        if (question.type !== "long_answer") return scores;
        const score = Number(rawScores[question.id]);
        scores[question.id] = Number.isFinite(score)
          ? Math.min(Math.max(score, 0), question.points)
          : 0;
        return scores;
      },
      {},
    );
    const earnedPoints =
      automatic.earnedPoints +
      Object.values(manualScores).reduce((total, score) => total + score, 0);
    const score =
      automatic.totalPoints > 0
        ? Math.round((earnedPoints / automatic.totalPoints) * 100)
        : 0;
    const passed = score >= attempt.quiz.passingScore;
    const feedback =
      typeof body.feedback === "string"
        ? body.feedback.trim().slice(0, 5000)
        : "";

    await prisma.quizAttempts.update({
      where: { id: attempt.id },
      data: {
        status: "graded",
        score,
        passed,
        earnedPoints,
        grading: manualScores as Prisma.InputJsonValue,
        feedback: feedback || null,
        gradedAt: new Date(),
      },
    });

    return sendResponse({
      status: 200,
      success: true,
      message: "Attempt graded successfully.",
      data: { score, passed },
    });
  }),
);
