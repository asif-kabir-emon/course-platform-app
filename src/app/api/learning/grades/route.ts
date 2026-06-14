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

const calculateFinalScore = (
  attempts: {
    status: string;
    totalPoints: number;
    score: number;
    gradedAt: Date | null;
    createdAt: Date;
  }[],
  strategy: "highest" | "latest" | "average" | "first",
) => {
  const validAttempts = attempts
    .filter(
      (attempt) => attempt.status === "graded" && attempt.totalPoints > 0,
    )
    .sort(
      (first, second) =>
        new Date(first.gradedAt ?? first.createdAt).getTime() -
        new Date(second.gradedAt ?? second.createdAt).getTime(),
    );

  if (validAttempts.length === 0) return null;
  if (strategy === "average") {
    return Math.round(
      validAttempts.reduce((total, attempt) => total + attempt.score, 0) /
        validAttempts.length,
    );
  }
  if (strategy === "latest") {
    return validAttempts[validAttempts.length - 1].score;
  }
  if (strategy === "first") return validAttempts[0].score;
  return Math.max(...validAttempts.map((attempt) => attempt.score));
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

    const assessmentMap = new Map<
      string,
      {
        quiz: (typeof attempts)[number]["quiz"];
        attempts: typeof attempts;
      }
    >();

    attempts.forEach((attempt) => {
      const existing = assessmentMap.get(attempt.quizId);
      if (existing) {
        existing.attempts.push(attempt);
      } else {
        assessmentMap.set(attempt.quizId, {
          quiz: attempt.quiz,
          attempts: [attempt],
        });
      }
    });

    const assessments = Array.from(assessmentMap.values()).map(
      ({ quiz, attempts: quizAttempts }) => {
        const gradeStrategy = quiz.gradeStrategy ?? "highest";
        const finalScore = quiz.isGradable
          ? calculateFinalScore(quizAttempts, gradeStrategy)
          : null;
        const pendingReview = quizAttempts.some(
          (attempt) => attempt.status === "pending_review",
        );

        return {
          id: quiz.id,
          title: quiz.title,
          kind: quiz.kind,
          passingScore: quiz.passingScore,
          gradeStrategy,
          isGradable: quiz.isGradable,
          finalScore,
          passed:
            finalScore === null || !quiz.isGradable
              ? null
              : finalScore >= quiz.passingScore,
          pendingReview,
          attemptCount: quizAttempts.length,
          validAttemptCount: quizAttempts.filter(
            (attempt) =>
              attempt.status === "graded" && attempt.totalPoints > 0,
          ).length,
          lesson: {
            id: quiz.lesson.id,
            name: quiz.lesson.name,
          },
          course: {
            id: quiz.lesson.section.courses.id,
            name: quiz.lesson.section.courses.name,
          },
          attempts: quizAttempts.map((attempt, index) => {
            const grading = parseNumberRecord(attempt.grading);

            return {
              id: attempt.id,
              number: quizAttempts.length - index,
              status: attempt.status,
              score: attempt.score,
              passed: attempt.passed,
              earnedPoints: attempt.earnedPoints,
              totalPoints: attempt.totalPoints,
              isValidGrade:
                attempt.status === "graded" && attempt.totalPoints > 0,
              startedAt: attempt.startedAt,
              submittedAt: attempt.submittedAt,
              gradedAt: attempt.gradedAt,
              feedback: attempt.feedback,
              manualGrades: quiz.questions
                .filter((question) => question.type === "long_answer")
                .map((question) => ({
                  questionId: question.id,
                  prompt: question.prompt,
                  earnedPoints: grading[question.id] ?? null,
                  possiblePoints: question.points,
                })),
            };
          }),
        };
      },
    );

    const calculatedGrades = assessments.filter(
      (assessment) => assessment.finalScore !== null,
    );
    const averageScore =
      calculatedGrades.length === 0
        ? null
        : Math.round(
            calculatedGrades.reduce(
              (total, assessment) => total + (assessment.finalScore ?? 0),
              0,
            ) / calculatedGrades.length,
          );
    const courseMap = new Map<
      string,
      {
        id: string;
        name: string;
        assessments: typeof assessments;
      }
    >();

    assessments.forEach((assessment) => {
      const existing = courseMap.get(assessment.course.id);
      if (existing) {
        existing.assessments.push(assessment);
      } else {
        courseMap.set(assessment.course.id, {
          id: assessment.course.id,
          name: assessment.course.name,
          assessments: [assessment],
        });
      }
    });

    const courses = Array.from(courseMap.values()).map((course) => {
      const courseGrades = course.assessments.filter(
        (assessment) => assessment.finalScore !== null,
      );

      return {
        ...course,
        summary: {
          totalAssessments: course.assessments.length,
          totalAttempts: course.assessments.reduce(
            (total, assessment) => total + assessment.attemptCount,
            0,
          ),
          gradedAssessments: courseGrades.length,
          passedAssessments: course.assessments.filter(
            (assessment) => assessment.passed === true,
          ).length,
          pendingReview: course.assessments.filter(
            (assessment) => assessment.pendingReview,
          ).length,
          averageScore:
            courseGrades.length === 0
              ? null
              : Math.round(
                  courseGrades.reduce(
                    (total, assessment) =>
                      total + (assessment.finalScore ?? 0),
                    0,
                  ) / courseGrades.length,
                ),
        },
      };
    });

    return sendResponse({
      status: 200,
      success: true,
      message: "Grades fetched successfully.",
      data: {
        summary: {
          totalAttempts: attempts.length,
          totalAssessments: assessments.length,
          gradedAssessments: calculatedGrades.length,
          pendingReview: assessments.filter(
            (assessment) => assessment.pendingReview,
          ).length,
          passedAssessments: assessments.filter(
            (assessment) => assessment.passed === true,
          ).length,
          averageScore,
        },
        courses,
        assessments,
      },
    });
  }),
);
