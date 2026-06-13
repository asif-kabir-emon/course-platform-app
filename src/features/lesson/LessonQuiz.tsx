"use client";

import { Button } from "@/components/ui/button";
import {
  useGetLessonQuizQuery,
  useSubmitLessonQuizMutation,
} from "@/redux/api/lessonApi";
import {
  CalendarClock,
  CheckCircle2,
  CircleHelp,
  Clock3,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type QuizResult = {
  score: number;
  passed: boolean;
  passingScore: number;
  results: {
    questionId: string;
    correct: boolean;
    correctOption: number;
    explanation: string;
  }[];
};

const LessonQuiz = ({ lessonId }: { lessonId: string }) => {
  const { data, isLoading } = useGetLessonQuizQuery(lessonId);
  const [submitQuiz, { isLoading: isSubmitting }] =
    useSubmitLessonQuizMutation();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const quiz = data?.success ? data.data : null;

  useEffect(() => {
    if (!quiz?.timeLimitMinutes || result) return;

    setSecondsRemaining(quiz.timeLimitMinutes * 60);
  }, [quiz?.id, quiz?.timeLimitMinutes, result]);

  const submitAnswers = useCallback(
    async (allowIncomplete = false) => {
      if (!quiz) return;
      if (
        !allowIncomplete &&
        Object.keys(answers).length !== quiz.questions.length
      ) {
        toast.error("Answer every question before submitting.");
        return;
      }

      try {
        const response = await submitQuiz({
          lessonId,
          answers: quiz.questions.map(
            (_question: unknown, index: number) => answers[index] ?? -1,
          ),
        }).unwrap();

        if (response.success) {
          setResult(response.data);
          toast.success(response.message);
        } else {
          toast.error(response.message);
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Failed to submit the quiz."));
      }
    },
    [answers, lessonId, quiz, submitQuiz],
  );

  useEffect(() => {
    if (secondsRemaining === null || result) return;
    if (secondsRemaining <= 0) {
      void submitAnswers(true);
      return;
    }

    const timer = window.setTimeout(
      () => setSecondsRemaining((current) => Math.max(0, (current ?? 1) - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [result, secondsRemaining, submitAnswers]);

  if (isLoading) {
    return <div className="h-52 animate-pulse rounded-2xl bg-muted" />;
  }

  if (!quiz) return null;

  return (
    <section className="surface-panel overflow-hidden">
      <div className="border-b bg-gradient-to-r from-primary/10 to-accent/10 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <CircleHelp className="size-5" />
          Knowledge check
        </div>
        <h2 className="mt-2 text-xl font-semibold">{quiz.title}</h2>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>Score {quiz.passingScore}% or higher to pass.</span>
          {quiz.maxAttempts && (
            <span>
              Attempt {Math.min(quiz.attemptCount + 1, quiz.maxAttempts)} of{" "}
              {quiz.maxAttempts}
            </span>
          )}
          {secondsRemaining !== null && !result && (
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Clock3 className="size-4" />
              {formatTime(secondsRemaining)}
            </span>
          )}
        </div>
        {(quiz.availableFrom || quiz.availableUntil) && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5" />
            Attempt window: {formatDate(quiz.availableFrom) || "Now"} to{" "}
            {formatDate(quiz.availableUntil) || "No end date"}
          </p>
        )}
      </div>
      <div className="space-y-6 p-5 sm:p-6">
        {!quiz.canAttempt && !result && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900">
            {quiz.unavailableReason || "This quiz is currently unavailable."}
          </div>
        )}
        {quiz.questions.map(
          (
            question: { id: string; prompt: string; options: string[] },
            questionIndex: number,
          ) => {
            const questionResult = result?.results[questionIndex];

            return (
              <fieldset key={question.id} className="space-y-3">
                <legend className="font-medium">
                  {questionIndex + 1}. {question.prompt}
                </legend>
                <div className="grid gap-2">
                  {question.options.map((option, optionIndex) => {
                    const isSelected = answers[questionIndex] === optionIndex;
                    const isCorrect =
                      questionResult?.correctOption === optionIndex;
                    const isWrongSelection =
                      Boolean(result) && isSelected && !isCorrect;

                    return (
                      <label
                        key={optionIndex}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors ${
                          isCorrect
                            ? "border-emerald-500/40 bg-emerald-500/5"
                            : isWrongSelection
                              ? "border-destructive/40 bg-destructive/5"
                              : isSelected
                                ? "border-primary bg-primary/5"
                                : "hover:bg-muted/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`quiz-question-${questionIndex}`}
                          checked={isSelected}
                          disabled={Boolean(result) || !quiz.canAttempt}
                          onChange={() =>
                            setAnswers((current) => ({
                              ...current,
                              [questionIndex]: optionIndex,
                            }))
                          }
                          className="mt-0.5 size-4 accent-primary"
                        />
                        <span className="flex-1">{option}</span>
                        {isCorrect && (
                          <CheckCircle2 className="size-4 text-emerald-600" />
                        )}
                        {isWrongSelection && (
                          <XCircle className="size-4 text-destructive" />
                        )}
                      </label>
                    );
                  })}
                </div>
                {questionResult?.explanation && (
                  <p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
                    {questionResult.explanation}
                  </p>
                )}
              </fieldset>
            );
          },
        )}

        {result ? (
          <div className="flex flex-col gap-3 rounded-2xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">
                {result.passed ? "Quiz passed" : "Keep learning and try again"}
              </p>
              <p className="text-sm text-muted-foreground">
                Your score: {result.score}% · Passing score:{" "}
                {result.passingScore}%
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setAnswers({});
                setResult(null);
              }}
              disabled={!quiz.canAttempt}
            >
              <RotateCcw className="size-4" />
              Try again
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => void submitAnswers()}
            disabled={isSubmitting || !quiz.canAttempt}
          >
            {isSubmitting ? "Submitting..." : "Submit quiz"}
          </Button>
        )}
      </div>
    </section>
  );
};

export default LessonQuiz;

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "";

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof error.data === "object" &&
    error.data !== null &&
    "message" in error.data &&
    typeof error.data.message === "string"
  ) {
    return error.data.message;
  }

  return fallback;
};
