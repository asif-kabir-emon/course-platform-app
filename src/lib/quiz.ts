import type {
  QuizQuestionType,
  QuizResponseValue,
  QuizResponses,
} from "@/types/quiz";

type GradingQuestion = {
  id: string;
  type: QuizQuestionType;
  correctOption: number;
  correctOptions: number[];
  acceptedAnswers: string[];
  caseSensitive: boolean;
  points: number;
};

const normalizeText = (value: string, caseSensitive: boolean) => {
  const normalized = value.trim().replace(/\s+/g, " ");
  return caseSensitive ? normalized : normalized.toLocaleLowerCase();
};

const sameSelections = (answer: number[], correct: number[]) => {
  const normalizedAnswer = [...new Set(answer)].sort((a, b) => a - b);
  const normalizedCorrect = [...new Set(correct)].sort((a, b) => a - b);

  return (
    normalizedAnswer.length === normalizedCorrect.length &&
    normalizedAnswer.every((value, index) => value === normalizedCorrect[index])
  );
};

export const gradeQuizResponses = (
  questions: GradingQuestion[],
  responses: QuizResponses,
) => {
  let earnedPoints = 0;
  let needsManualGrading = false;

  const results = questions.map((question) => {
    const response: QuizResponseValue = responses[question.id] ?? {};
    let correct: boolean | null = false;

    if (
      question.type === "single_choice" ||
      question.type === "true_false"
    ) {
      correct =
        response.selectedOptions?.[0] ===
        (question.correctOptions[0] ?? question.correctOption);
    } else if (question.type === "multiple_choice") {
      correct = sameSelections(
        response.selectedOptions ?? [],
        question.correctOptions,
      );
    } else if (question.type === "short_answer") {
      const answer = normalizeText(
        response.text ?? "",
        question.caseSensitive,
      );
      correct = question.acceptedAnswers.some(
        (acceptedAnswer) =>
          normalizeText(acceptedAnswer, question.caseSensitive) === answer,
      );
    } else {
      correct = null;
      needsManualGrading = true;
    }

    const awardedPoints = correct ? question.points : 0;
    earnedPoints += awardedPoints;

    return {
      questionId: question.id,
      correct,
      awardedPoints,
    };
  });

  const totalPoints = questions.reduce(
    (total, question) => total + question.points,
    0,
  );
  const score =
    totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

  return {
    earnedPoints,
    totalPoints,
    score,
    needsManualGrading,
    results,
  };
};

export const sanitizeQuizResponses = (
  value: unknown,
  questionIds: Set<string>,
): QuizResponses => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.entries(value).reduce<QuizResponses>(
    (responses, [questionId, rawResponse]) => {
      if (
        !questionIds.has(questionId) ||
        !rawResponse ||
        typeof rawResponse !== "object" ||
        Array.isArray(rawResponse)
      ) {
        return responses;
      }

      const response = rawResponse as {
        selectedOptions?: unknown;
        text?: unknown;
      };
      responses[questionId] = {
        ...(Array.isArray(response.selectedOptions)
          ? {
              selectedOptions: response.selectedOptions
                .map(Number)
                .filter(Number.isInteger),
            }
          : {}),
        ...(typeof response.text === "string"
          ? { text: response.text.slice(0, 20_000) }
          : {}),
      };

      return responses;
    },
    {},
  );
};
