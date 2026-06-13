"use client";

import { Button } from "@/components/ui/button";
import {
  useGetLessonQuizQuery,
  useStartQuizAttemptMutation,
} from "@/redux/api/lessonApi";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleHelp,
  Clock3,
  FileCheck2,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const LessonQuiz = ({
  lessonId,
  courseId,
}: {
  lessonId: string;
  courseId: string;
}) => {
  const router = useRouter();
  const { data, isLoading } = useGetLessonQuizQuery(lessonId);
  const [startAttempt, { isLoading: isStarting }] =
    useStartQuizAttemptMutation();
  const quiz = data?.success ? data.data : null;

  const beginAttempt = async () => {
    try {
      const response = await startAttempt(lessonId).unwrap();
      if (!response.success) {
        toast.error(response.message);
        return;
      }

      router.push(
        `/courses/${courseId}/lessons/${lessonId}/attempt/${response.data.attemptId}`,
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to start this attempt."));
    }
  };

  if (isLoading) {
    return <div className="h-52 animate-pulse rounded-2xl bg-muted" />;
  }
  if (!quiz) return null;

  const assessmentLabel = quiz.kind === "exam" ? "Exam" : "Quiz";
  const remainingAttempts =
    quiz.maxAttempts === null
      ? null
      : Math.max(quiz.maxAttempts - quiz.attemptCount, 0);

  return (
    <section className="surface-panel overflow-hidden">
      <div className="border-b bg-gradient-to-r from-primary/10 to-accent/10 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <CircleHelp className="size-5" />
          {assessmentLabel}
        </div>
        <h2 className="mt-2 text-xl font-semibold">{quiz.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review the rules before starting. The timer begins only after you
          press Start.
        </p>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Rule
            icon={FileCheck2}
            label="Questions"
            value={String(quiz.questions.length)}
          />
          <Rule
            icon={Clock3}
            label="Time limit"
            value={
              quiz.timeLimitMinutes
                ? `${quiz.timeLimitMinutes} minutes`
                : "No fixed limit"
            }
          />
          <Rule
            icon={RotateCcw}
            label="Attempts"
            value={
              remainingAttempts === null
                ? "Unlimited"
                : `${remainingAttempts} remaining`
            }
          />
          <Rule
            icon={CheckCircle2}
            label="Result"
            value={
              quiz.isGradable
                ? `${quiz.passingScore}% to pass`
                : "Completion only"
            }
          />
        </div>

        {(quiz.availableFrom || quiz.availableUntil) && (
          <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
            <CalendarClock className="mt-0.5 size-4 shrink-0" />
            <span>
              Attempt window: {formatDate(quiz.availableFrom) || "Now"} to{" "}
              {formatDate(quiz.availableUntil) || "No end date"}
            </span>
          </div>
        )}

        {quiz.latestAttempt && (
          <div className="rounded-xl border p-4 text-sm">
            <p className="font-medium">
              {quiz.latestAttempt.status === "in_progress"
                ? "Attempt in progress"
                : "Latest attempt"}
            </p>
            <p className="mt-1 text-muted-foreground">
              {quiz.latestAttempt.status === "in_progress"
                ? "Continue before the attempt timer expires."
                : `Score ${quiz.latestAttempt.score}% · ${
                    quiz.latestAttempt.passed ? "Passed" : "Not passed"
                  } · ${formatDate(quiz.latestAttempt.createdAt)}`}
            </p>
          </div>
        )}

        {!quiz.canAttempt && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900">
            {quiz.unavailableReason || "This assessment is unavailable."}
          </div>
        )}

        <Button
          type="button"
          onClick={() => void beginAttempt()}
          disabled={!quiz.canAttempt || isStarting}
          className="w-full sm:w-auto"
        >
          {isStarting
            ? "Starting..."
            : quiz.latestAttempt?.status === "in_progress"
              ? "Continue attempt"
              : `Start ${assessmentLabel.toLowerCase()}`}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </section>
  );
};

const Rule = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) => (
  <div className="rounded-xl border bg-background p-4">
    <Icon className="size-5 text-primary" />
    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
    <p className="mt-1 font-semibold">{value}</p>
  </div>
);

export default LessonQuiz;

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
