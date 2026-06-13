import { Prisma } from "@prisma/client";
import { gradeQuizResponses, sanitizeQuizResponses } from "@/lib/quiz";
import { prisma } from "@/lib/prisma";
import type { QuizQuestionType, QuizResponses } from "@/types/quiz";
import { ApiError } from "@/utils/apiError";
import { authGuard } from "@/utils/authGuard";
import { catchAsync } from "@/utils/handleApi";
import { sendResponse } from "@/utils/sendResponse";

type AttemptContext = {
  params: Promise<{ lesson: string; attempt: string }>;
};

const getAttempt = async (attemptId: string, lessonId: string, userId: string) =>
  prisma.quizAttempts.findFirst({
    where: {
      id: attemptId,
      userId,
      quiz: { lessonId },
    },
    include: {
      quiz: {
        include: {
          questions: { orderBy: { order: "asc" } },
        },
      },
    },
  });

const getResponses = (value: Prisma.JsonValue | null): QuizResponses =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as QuizResponses)
    : {};

const isExpired = (expiresAt: Date | null) =>
  Boolean(expiresAt && new Date() >= expiresAt);

const finalizeAttempt = async (
  attempt: NonNullable<Awaited<ReturnType<typeof getAttempt>>>,
  responses: QuizResponses,
  timedOut: boolean,
) => {
  const grading = gradeQuizResponses(
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
  const pendingReview =
    attempt.quiz.isGradable && grading.needsManualGrading;
  const score = attempt.quiz.isGradable ? grading.score : 0;
  const passed =
    !attempt.quiz.isGradable || (!pendingReview && score >= attempt.quiz.passingScore);
  const now = new Date();

  const savedAttempt = await prisma.quizAttempts.update({
    where: { id: attempt.id },
    data: {
      status: pendingReview
          ? "pending_review"
          : timedOut
            ? "timed_out"
          : attempt.quiz.isGradable
            ? "graded"
            : "submitted",
      responses: responses as Prisma.InputJsonValue,
      score,
      passed,
      earnedPoints: grading.earnedPoints,
      totalPoints: grading.totalPoints,
      submittedAt: timedOut ? attempt.expiresAt ?? now : now,
      gradedAt:
        !timedOut && attempt.quiz.isGradable && !pendingReview ? now : null,
    },
  });

  return { savedAttempt, grading, pendingReview };
};

export const GET = authGuard(
  catchAsync(async (request: Request, context: unknown) => {
    const user = request.user;
    const { lesson: lessonId, attempt: attemptId } = await (
      context as AttemptContext
    ).params;

    if (!user) return ApiError(401, "Unauthorized access.");

    let attempt = await getAttempt(attemptId, lessonId, user.id);
    if (!attempt) return ApiError(404, "Attempt not found.");

    if (attempt.status === "in_progress" && isExpired(attempt.expiresAt)) {
      await finalizeAttempt(attempt, getResponses(attempt.responses), true);
      attempt = await getAttempt(attemptId, lessonId, user.id);
      if (!attempt) return ApiError(404, "Attempt not found.");
    }

    return sendResponse({
      status: 200,
      success: true,
      message: "Attempt fetched successfully.",
      data: {
        id: attempt.id,
        status: attempt.status,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        submittedAt: attempt.submittedAt,
        timedOut: Boolean(
          attempt.expiresAt &&
            attempt.submittedAt &&
            attempt.submittedAt >= attempt.expiresAt,
        ),
        score: attempt.score,
        passed: attempt.passed,
        responses: getResponses(attempt.responses),
        quiz: {
          id: attempt.quiz.id,
          title: attempt.quiz.title,
          kind: attempt.quiz.kind,
          passingScore: attempt.quiz.passingScore,
          isGradable: attempt.quiz.isGradable,
          questions: attempt.quiz.questions.map((question) => ({
            id: question.id,
            prompt: question.prompt,
            type: question.type,
            options: question.options,
            points: question.points,
          })),
        },
      },
    });
  }),
);

export const PATCH = authGuard(
  catchAsync(async (request: Request, context: unknown) => {
    const user = request.user;
    const { lesson: lessonId, attempt: attemptId } = await (
      context as AttemptContext
    ).params;
    const { responses } = await request.json();

    if (!user) return ApiError(401, "Unauthorized access.");
    const attempt = await getAttempt(attemptId, lessonId, user.id);
    if (!attempt) return ApiError(404, "Attempt not found.");
    if (attempt.status !== "in_progress") {
      return ApiError(409, "This attempt can no longer be changed.");
    }
    if (isExpired(attempt.expiresAt)) {
      await finalizeAttempt(attempt, getResponses(attempt.responses), true);
      return ApiError(409, "Time is up. This attempt has been closed.");
    }

    const sanitized = sanitizeQuizResponses(
      responses,
      new Set(attempt.quiz.questions.map((question) => question.id)),
    );
    await prisma.quizAttempts.update({
      where: { id: attempt.id },
      data: { responses: sanitized as Prisma.InputJsonValue },
    });

    return sendResponse({
      status: 200,
      success: true,
      message: "Answers saved.",
      data: { savedAt: new Date() },
    });
  }),
);

export const POST = authGuard(
  catchAsync(async (request: Request, context: unknown) => {
    const user = request.user;
    const { lesson: lessonId, attempt: attemptId } = await (
      context as AttemptContext
    ).params;
    const { responses } = await request.json();

    if (!user) return ApiError(401, "Unauthorized access.");
    const attempt = await getAttempt(attemptId, lessonId, user.id);
    if (!attempt) return ApiError(404, "Attempt not found.");
    if (attempt.status !== "in_progress") {
      return ApiError(409, "This attempt has already been submitted.");
    }

    const savedResponses = getResponses(attempt.responses);
    const incomingResponses = sanitizeQuizResponses(
      responses,
      new Set(attempt.quiz.questions.map((question) => question.id)),
    );
    const mergedResponses = { ...savedResponses, ...incomingResponses };
    const timedOut = isExpired(attempt.expiresAt);
    const { savedAttempt, grading, pendingReview } = await finalizeAttempt(
      attempt,
      mergedResponses,
      timedOut,
    );

    return sendResponse({
      status: 200,
      success: true,
      message: timedOut
        ? "Time is up. Your saved answers were submitted."
        : pendingReview
          ? "Attempt submitted for grading."
          : savedAttempt.passed
            ? "Attempt passed. Great work!"
            : "Attempt submitted.",
      data: {
        status: savedAttempt.status,
        score: savedAttempt.score,
        passed: savedAttempt.passed,
        passingScore: attempt.quiz.passingScore,
        pendingReview,
        timedOut,
        results: grading.results.map((result) => {
          const question = attempt.quiz.questions.find(
            ({ id }) => id === result.questionId,
          );

          return {
            ...result,
            correctOptions:
              question && question.correctOptions.length > 0
                ? question.correctOptions
                : question
                  ? [question.correctOption]
                  : [],
            explanation: question?.explanation ?? "",
          };
        }),
      },
    });
  }),
);
