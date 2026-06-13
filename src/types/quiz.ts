export const quizKinds = ["quiz", "exam"] as const;
export type QuizKind = (typeof quizKinds)[number];

export const quizQuestionTypes = [
  "single_choice",
  "multiple_choice",
  "true_false",
  "short_answer",
  "long_answer",
] as const;
export type QuizQuestionType = (typeof quizQuestionTypes)[number];

export type QuizResponseValue = {
  selectedOptions?: number[];
  text?: string;
};

export type QuizResponses = Record<string, QuizResponseValue>;

export const isQuizQuestionType = (
  value: unknown,
): value is QuizQuestionType =>
  quizQuestionTypes.includes(value as QuizQuestionType);

export const isQuizKind = (value: unknown): value is QuizKind =>
  quizKinds.includes(value as QuizKind);

export const isChoiceQuestion = (type: QuizQuestionType) =>
  type === "single_choice" ||
  type === "multiple_choice" ||
  type === "true_false";

export const requiresManualGrading = (type: QuizQuestionType) =>
  type === "long_answer";
