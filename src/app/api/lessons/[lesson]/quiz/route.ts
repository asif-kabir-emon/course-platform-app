import { isAdminRole } from "@/constants/UserRole.constant";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/apiError";
import { authGuard } from "@/utils/authGuard";
import { catchAsync } from "@/utils/handleApi";
import { sendResponse } from "@/utils/sendResponse";

type QuizQuestionInput = {
  prompt?: unknown;
  options?: unknown;
  correctOption?: unknown;
  explanation?: unknown;
};

const getLesson = (lessonId: string) =>
  prisma.courseLessons.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      section: { select: { courseId: true } },
    },
  });

const hasCourseAccess = async (userId: string, courseId: string) =>
  Boolean(
    await prisma.userCourseAccess.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true },
    }),
  );

export const GET = authGuard(
  catchAsync(async (request: Request, context: unknown) => {
    const user = request.user;
    const { lesson: lessonId } = await (
      context as { params: Promise<{ lesson: string }> }
    ).params;

    if (!user || !lessonId) {
      return ApiError(401, "Unauthorized access.");
    }

    const lesson = await getLesson(lessonId);
    if (!lesson) {
      return ApiError(404, "Lesson not found.");
    }

    const isAdmin = isAdminRole(user.role);
    if (
      !isAdmin &&
      !(await hasCourseAccess(user.id, lesson.section.courseId))
    ) {
      return ApiError(403, "You do not have access to this lesson.");
    }

    const quiz = await prisma.lessonQuizzes.findUnique({
      where: { lessonId },
      include: {
        questions: { orderBy: { order: "asc" } },
        attempts: isAdmin
          ? false
          : {
              where: { userId: user.id },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                score: true,
                passed: true,
                createdAt: true,
              },
            },
      },
    });

    if (!quiz || (!isAdmin && !quiz.isPublished)) {
      return sendResponse({
        status: 200,
        message: "This lesson does not have a published quiz.",
        success: true,
        data: null,
      });
    }

    const attemptCount = isAdmin
      ? 0
      : await prisma.quizAttempts.count({
          where: { quizId: quiz.id, userId: user.id },
        });
    const now = new Date();
    const isBeforeWindow =
      Boolean(quiz.availableFrom) && now < (quiz.availableFrom as Date);
    const isAfterWindow =
      Boolean(quiz.availableUntil) && now > (quiz.availableUntil as Date);
    const hasAttemptsRemaining =
      quiz.maxAttempts === null || attemptCount < quiz.maxAttempts;

    return sendResponse({
      status: 200,
      message: "Lesson quiz fetched successfully.",
      success: true,
      data: {
        id: quiz.id,
        title: quiz.title,
        passingScore: quiz.passingScore,
        isPublished: quiz.isPublished,
        timeLimitMinutes: quiz.timeLimitMinutes,
        maxAttempts: quiz.maxAttempts,
        availableFrom: quiz.availableFrom,
        availableUntil: quiz.availableUntil,
        questions: quiz.questions.map((question) => ({
          id: question.id,
          prompt: question.prompt,
          options: question.options,
          ...(isAdmin
            ? {
                correctOption: question.correctOption,
                explanation: question.explanation ?? "",
              }
            : {}),
        })),
        ...(!isAdmin && {
          attemptCount,
          canAttempt:
            !isBeforeWindow && !isAfterWindow && hasAttemptsRemaining,
          unavailableReason: isBeforeWindow
            ? "This quiz is not open yet."
            : isAfterWindow
              ? "This quiz attempt window has closed."
              : !hasAttemptsRemaining
                ? "You have used all available attempts."
                : null,
          latestAttempt: Array.isArray(quiz.attempts)
            ? (quiz.attempts[0] ?? null)
            : null,
        }),
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

    if (!user || !isAdminRole(user.role)) {
      return ApiError(403, "Admin access is required.");
    }

    const lesson = await getLesson(lessonId);
    if (!lesson) {
      return ApiError(404, "Lesson not found.");
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const passingScore = Number(body.passingScore);
    const isPublished = body.isPublished === true;
    const timeLimitMinutes =
      body.timeLimitMinutes === null ||
      body.timeLimitMinutes === undefined ||
      body.timeLimitMinutes === ""
        ? null
        : Number(body.timeLimitMinutes);
    const maxAttempts =
      body.maxAttempts === null ||
      body.maxAttempts === undefined ||
      body.maxAttempts === ""
        ? null
        : Number(body.maxAttempts);
    const availableFrom = body.availableFrom
      ? new Date(body.availableFrom)
      : null;
    const availableUntil = body.availableUntil
      ? new Date(body.availableUntil)
      : null;
    const questions = Array.isArray(body.questions)
      ? (body.questions as QuizQuestionInput[])
      : [];

    if (
      !title ||
      !Number.isInteger(passingScore) ||
      passingScore < 1 ||
      passingScore > 100
    ) {
      return ApiError(400, "Enter a title and a passing score from 1 to 100.");
    }
    if (
      (timeLimitMinutes !== null &&
        (!Number.isInteger(timeLimitMinutes) || timeLimitMinutes < 1)) ||
      (maxAttempts !== null &&
        (!Number.isInteger(maxAttempts) || maxAttempts < 1))
    ) {
      return ApiError(400, "Time limits and attempt limits must be positive.");
    }
    if (
      (availableFrom && Number.isNaN(availableFrom.getTime())) ||
      (availableUntil && Number.isNaN(availableUntil.getTime())) ||
      (availableFrom && availableUntil && availableFrom >= availableUntil)
    ) {
      return ApiError(400, "Enter a valid quiz start and end date.");
    }

    const normalizedQuestions = questions.map((question, index) => {
      const prompt =
        typeof question.prompt === "string" ? question.prompt.trim() : "";
      const options = Array.isArray(question.options)
        ? question.options.map((option) =>
            typeof option === "string" ? option.trim() : "",
          )
        : [];
      const correctOption = Number(question.correctOption);
      const explanation =
        typeof question.explanation === "string"
          ? question.explanation.trim()
          : "";

      if (
        !prompt ||
        options.length < 2 ||
        options.some((option) => !option) ||
        !Number.isInteger(correctOption) ||
        correctOption < 0 ||
        correctOption >= options.length
      ) {
        throw Object.assign(
          new Error(`Question ${index + 1} is incomplete.`),
          { status: 400 },
        );
      }

      return { prompt, options, correctOption, explanation, order: index };
    });

    if (isPublished && normalizedQuestions.length === 0) {
      return ApiError(400, "Add at least one question before publishing.");
    }

    const quiz = await prisma.$transaction(async (transaction) => {
      const savedQuiz = await transaction.lessonQuizzes.upsert({
        where: { lessonId },
        update: {
          title,
          passingScore,
          isPublished,
          timeLimitMinutes,
          maxAttempts,
          availableFrom,
          availableUntil,
        },
        create: {
          lessonId,
          title,
          passingScore,
          isPublished,
          timeLimitMinutes,
          maxAttempts,
          availableFrom,
          availableUntil,
        },
      });

      await transaction.quizQuestions.deleteMany({
        where: { quizId: savedQuiz.id },
      });

      if (normalizedQuestions.length > 0) {
        await transaction.quizQuestions.createMany({
          data: normalizedQuestions.map((question) => ({
            ...question,
            explanation: question.explanation || null,
            quizId: savedQuiz.id,
          })),
        });
      }

      return savedQuiz;
    });

    return sendResponse({
      status: 200,
      message: isPublished ? "Quiz published successfully." : "Quiz draft saved.",
      success: true,
      data: quiz,
    });
  }),
);

export const POST = authGuard(
  catchAsync(async (request: Request, context: unknown) => {
    const user = request.user;
    const { lesson: lessonId } = await (
      context as { params: Promise<{ lesson: string }> }
    ).params;
    const { answers } = await request.json();

    if (!user || !Array.isArray(answers)) {
      return ApiError(400, "Quiz answers are required.");
    }
    if (isAdminRole(user.role)) {
      return ApiError(403, "Admin preview does not record quiz attempts.");
    }

    const lesson = await getLesson(lessonId);
    if (
      !lesson ||
      !(await hasCourseAccess(user.id, lesson.section.courseId))
    ) {
      return ApiError(403, "You do not have access to this lesson.");
    }

    const quiz = await prisma.lessonQuizzes.findUnique({
      where: { lessonId },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    if (!quiz?.isPublished || quiz.questions.length === 0) {
      return ApiError(404, "No published quiz is available.");
    }
    const now = new Date();
    if (quiz.availableFrom && now < quiz.availableFrom) {
      return ApiError(403, "This quiz is not open yet.");
    }
    if (quiz.availableUntil && now > quiz.availableUntil) {
      return ApiError(403, "This quiz attempt window has closed.");
    }
    if (quiz.maxAttempts !== null) {
      const attemptCount = await prisma.quizAttempts.count({
        where: { quizId: quiz.id, userId: user.id },
      });
      if (attemptCount >= quiz.maxAttempts) {
        return ApiError(403, "You have used all available quiz attempts.");
      }
    }

    const normalizedAnswers = answers.map((answer) => Number(answer));
    if (
      normalizedAnswers.length !== quiz.questions.length ||
      normalizedAnswers.some((answer) => !Number.isInteger(answer))
    ) {
      return ApiError(400, "Answer every question before submitting.");
    }

    const correctAnswers = quiz.questions.reduce(
      (total, question, index) =>
        total + (normalizedAnswers[index] === question.correctOption ? 1 : 0),
      0,
    );
    const score = Math.round(
      (correctAnswers / quiz.questions.length) * 100,
    );
    const passed = score >= quiz.passingScore;

    await prisma.quizAttempts.create({
      data: {
        quizId: quiz.id,
        userId: user.id,
        score,
        passed,
        answers: normalizedAnswers,
      },
    });

    return sendResponse({
      status: 200,
      message: passed
        ? "Quiz passed. Great work!"
        : "Quiz submitted. Review the answers and try again.",
      success: true,
      data: {
        score,
        passed,
        passingScore: quiz.passingScore,
        results: quiz.questions.map((question, index) => ({
          questionId: question.id,
          correct: normalizedAnswers[index] === question.correctOption,
          correctOption: question.correctOption,
          explanation: question.explanation ?? "",
        })),
      },
    });
  }),
);
