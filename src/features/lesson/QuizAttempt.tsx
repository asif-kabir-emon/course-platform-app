"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useFinishQuizAttemptMutation,
  useGetQuizAttemptQuery,
  useSaveQuizAttemptMutation,
} from "@/hooks/lesson.hook";
import { cn } from "@/lib/utils";
import type {
  QuizQuestionType,
  QuizResponses,
  QuizResponseValue,
} from "@/types/quiz";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Save,
  Send,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type AttemptResult = {
  status: string;
  score: number;
  passed: boolean;
  passingScore: number;
  pendingReview: boolean;
  timedOut: boolean;
};

const QuizAttempt = ({
  courseId,
  lessonId,
  attemptId,
}: {
  courseId: string;
  lessonId: string;
  attemptId: string;
}) => {
  const { data, isLoading } = useGetQuizAttemptQuery({
    lessonId,
    attemptId,
  });
  const [saveAttempt] = useSaveQuizAttemptMutation();
  const [finishAttempt, { isLoading: isSubmitting }] =
    useFinishQuizAttemptMutation();
  const [responses, setResponses] = useState<QuizResponses>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const hydratedAttemptId = useRef<string | null>(null);
  const isFinishing = useRef(false);
  const attempt = data?.success ? data.data : null;

  useEffect(() => {
    if (!attempt || hydratedAttemptId.current === attempt.id) return;
    hydratedAttemptId.current = attempt.id;
    setResponses(attempt.responses || {});
    if (attempt.status !== "in_progress") {
      setResult({
        status: attempt.status,
        score: attempt.score,
        passed: attempt.passed,
        passingScore: attempt.quiz.passingScore,
        pendingReview: attempt.status === "pending_review",
        timedOut: attempt.timedOut || attempt.status === "timed_out",
      });
    }
  }, [attempt]);

  useEffect(() => {
    if (!attempt?.expiresAt || attempt.status !== "in_progress" || result) {
      setSecondsRemaining(null);
      return;
    }

    const updateTimer = () => {
      setSecondsRemaining(
        Math.max(
          0,
          Math.ceil(
            (new Date(attempt.expiresAt).getTime() - Date.now()) / 1000,
          ),
        ),
      );
    };
    updateTimer();
    const timer = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(timer);
  }, [attempt?.expiresAt, attempt?.status, result]);

  useEffect(() => {
    if (
      !attempt ||
      attempt.status !== "in_progress" ||
      result ||
      hydratedAttemptId.current !== attempt.id
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      void saveAttempt({ lessonId, attemptId, responses });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [attempt, attemptId, lessonId, responses, result, saveAttempt]);

  const submit = useCallback(
    async (timedOut = false) => {
      if (!attempt || result || isFinishing.current) return;
      isFinishing.current = true;

      try {
        const response = await finishAttempt({
          lessonId,
          attemptId,
          responses,
        }).unwrap();
        if (response.success) {
          setResult(response.data);
          toast[response.data.timedOut || timedOut ? "warning" : "success"](
            response.message,
          );
        } else {
          toast.error(response.message);
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Unable to submit the attempt."));
      } finally {
        isFinishing.current = false;
      }
    },
    [attempt, attemptId, finishAttempt, lessonId, responses, result],
  );

  useEffect(() => {
    if (secondsRemaining === 0 && !result) {
      void submit(true);
    }
  }, [result, secondsRemaining, submit]);

  if (isLoading) {
    return <div className="h-[32rem] animate-pulse rounded-2xl bg-muted" />;
  }
  if (!attempt) {
    return (
      <div className="surface-panel p-8 text-center">
        This attempt could not be loaded.
      </div>
    );
  }

  const locked = attempt.status !== "in_progress" || Boolean(result);

  if (result) {
    return (
      <AttemptResultCard
        result={result}
        title={attempt.quiz.title}
        courseId={courseId}
        lessonId={lessonId}
        isGradable={attempt.quiz.isGradable}
      />
    );
  }

  return (
    <div className="space-y-5">
      <header className="surface-panel sticky top-20 z-20 flex flex-col gap-4 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {attempt.quiz.kind === "exam" ? "Exam attempt" : "Quiz attempt"}
          </p>
          <h1 className="mt-1 text-xl font-bold">{attempt.quiz.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 font-semibold">
            <Clock3 className="size-4 text-primary" />
            {secondsRemaining === null
              ? "No time limit"
              : formatTime(secondsRemaining)}
          </span>
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <Save className="size-3.5" />
            Answers save automatically
          </span>
        </div>
      </header>

      <div className="space-y-4">
        {attempt.quiz.questions.map(
          (
            question: {
              id: string;
              prompt: string;
              type: QuizQuestionType;
              options: string[];
              points: number;
            },
            index: number,
          ) => (
            <QuestionCard
              key={question.id}
              question={question}
              number={index + 1}
              value={responses[question.id] ?? {}}
              disabled={locked}
              onChange={(value) =>
                setResponses((current) => ({
                  ...current,
                  [question.id]: value,
                }))
              }
            />
          ),
        )}
      </div>

      <div className="surface-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          You may submit with unanswered questions. Saved answers are used if
          time expires.
        </p>
        <Button
          type="button"
          onClick={() => void submit()}
          disabled={isSubmitting || locked}
          className="sm:min-w-36"
        >
          <Send className="size-4" />
          {isSubmitting ? "Submitting..." : "Submit attempt"}
        </Button>
      </div>
    </div>
  );
};

const QuestionCard = ({
  question,
  number,
  value,
  disabled,
  onChange,
}: {
  question: {
    id: string;
    prompt: string;
    type: QuizQuestionType;
    options: string[];
    points: number;
  };
  number: number;
  value: QuizResponseValue;
  disabled: boolean;
  onChange: (value: QuizResponseValue) => void;
}) => (
  <fieldset className="surface-panel p-5 sm:p-6" disabled={disabled}>
    <legend className="sr-only">Question {number}</legend>
    <div className="flex items-start justify-between gap-4">
      <h2 className="font-semibold leading-7">
        {number}. {question.prompt}
      </h2>
      <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
        {question.points} {question.points === 1 ? "point" : "points"}
      </span>
    </div>

    {(question.type === "single_choice" ||
      question.type === "true_false" ||
      question.type === "multiple_choice") && (
      <div className="mt-4 grid gap-2">
        {question.options.map((option, optionIndex) => {
          const selected =
            value.selectedOptions?.includes(optionIndex) ?? false;
          const multiple = question.type === "multiple_choice";

          return (
            <label
              key={optionIndex}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors",
                selected ? "border-primary bg-primary/5" : "hover:bg-muted/40",
              )}
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                name={`question-${question.id}`}
                checked={selected}
                onChange={() => {
                  const current = value.selectedOptions ?? [];
                  onChange({
                    selectedOptions: multiple
                      ? selected
                        ? current.filter((item) => item !== optionIndex)
                        : [...current, optionIndex]
                      : [optionIndex],
                  });
                }}
                className="mt-0.5 size-4 accent-primary"
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
    )}

    {question.type === "short_answer" && (
      <Input
        value={value.text ?? ""}
        onChange={(event) => onChange({ text: event.target.value })}
        placeholder="Type your answer"
        className="mt-4"
      />
    )}

    {question.type === "long_answer" && (
      <Textarea
        value={value.text ?? ""}
        onChange={(event) => onChange({ text: event.target.value })}
        placeholder="Write your answer"
        className="mt-4 min-h-40"
      />
    )}
  </fieldset>
);

const AttemptResultCard = ({
  result,
  title,
  courseId,
  lessonId,
  isGradable,
}: {
  result: AttemptResult;
  title: string;
  courseId: string;
  lessonId: string;
  isGradable: boolean;
}) => {
  const pending = result.pendingReview;
  const Icon = pending ? Clock3 : result.passed ? CheckCircle2 : XCircle;

  return (
    <section className="surface-panel mx-auto max-w-2xl p-6 text-center sm:p-10">
      <Icon
        className={cn(
          "mx-auto size-14",
          pending
            ? "text-amber-600"
            : result.passed
              ? "text-emerald-600"
              : "text-destructive",
        )}
      />
      <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-primary">
        {result.timedOut ? "Time expired" : "Attempt submitted"}
      </p>
      <h1 className="mt-2 text-2xl font-bold">{title}</h1>
      <p className="mt-3 text-muted-foreground">
        {pending
          ? "Your written responses are awaiting manual grading."
          : isGradable
            ? `Score ${result.score}% · Passing score ${result.passingScore}%`
            : "Your submission has been recorded."}
      </p>
      <Button asChild className="mt-6">
        <Link href={`/courses/${courseId}/lessons/${lessonId}`}>
          <ArrowLeft className="size-4" />
          Return to lesson
        </Link>
      </Button>
    </section>
  );
};

export default QuizAttempt;

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

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
