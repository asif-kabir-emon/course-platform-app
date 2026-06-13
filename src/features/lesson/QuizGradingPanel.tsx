"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetPendingQuizAttemptsQuery,
  useGradeQuizAttemptMutation,
} from "@/redux/api/lessonApi";
import type { QuizQuestionType, QuizResponses } from "@/types/quiz";
import { CheckCircle2, ClipboardCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type PendingAttempt = {
  id: string;
  learnerName: string;
  learnerEmail: string;
  submittedAt?: string | null;
  responses: QuizResponses;
  questions: {
    id: string;
    prompt: string;
    type: QuizQuestionType;
    points: number;
  }[];
};

const QuizGradingPanel = ({ lessonId }: { lessonId: string }) => {
  const { data, isLoading } = useGetPendingQuizAttemptsQuery(lessonId);
  const attempts: PendingAttempt[] = data?.success ? data.data : [];

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-muted" />;
  }
  if (attempts.length === 0) return null;

  return (
    <section className="surface-panel overflow-hidden">
      <div className="border-b bg-muted/30 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-primary">
          <ClipboardCheck className="size-5" />
          <h2 className="text-lg font-semibold">Manual grading</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {attempts.length} written{" "}
          {attempts.length === 1 ? "attempt needs" : "attempts need"} review.
        </p>
      </div>
      <div className="space-y-4 p-4 sm:p-6">
        {attempts.map((attempt) => (
          <AttemptGrader
            key={attempt.id}
            lessonId={lessonId}
            attempt={attempt}
          />
        ))}
      </div>
    </section>
  );
};

const AttemptGrader = ({
  lessonId,
  attempt,
}: {
  lessonId: string;
  attempt: PendingAttempt;
}) => {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");
  const [gradeAttempt, { isLoading }] = useGradeQuizAttemptMutation();
  const writtenQuestions = attempt.questions.filter(
    (question) => question.type === "long_answer",
  );

  const saveGrade = async () => {
    try {
      const response = await gradeAttempt({
        lessonId,
        attemptId: attempt.id,
        scores,
        feedback,
      }).unwrap();
      toast[response.success ? "success" : "error"](response.message);
    } catch {
      toast.error("Unable to grade this attempt.");
    }
  };

  return (
    <article className="rounded-2xl border p-4 sm:p-5">
      <div>
        <h3 className="font-semibold">{attempt.learnerName}</h3>
        <p className="text-xs text-muted-foreground">
          {attempt.learnerEmail}
          {attempt.submittedAt
            ? ` · ${new Intl.DateTimeFormat(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(attempt.submittedAt))}`
            : ""}
        </p>
      </div>

      <div className="mt-5 space-y-4">
        {writtenQuestions.map((question, index) => (
          <div key={question.id} className="rounded-xl bg-muted/35 p-4">
            <p className="font-medium">
              {index + 1}. {question.prompt}
            </p>
            <div className="mt-3 whitespace-pre-wrap rounded-lg border bg-background p-3 text-sm">
              {attempt.responses[question.id]?.text || "No answer provided."}
            </div>
            <label className="mt-3 flex max-w-48 items-center gap-2 text-sm">
              <span className="shrink-0">Points</span>
              <Input
                type="number"
                min={0}
                max={question.points}
                value={scores[question.id] ?? ""}
                onChange={(event) =>
                  setScores((current) => ({
                    ...current,
                    [question.id]: Number(event.target.value),
                  }))
                }
              />
              <span>/ {question.points}</span>
            </label>
          </div>
        ))}
        <Textarea
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          placeholder="Overall feedback for the learner (optional)"
        />
        <Button
          type="button"
          onClick={() => void saveGrade()}
          disabled={isLoading}
        >
          <CheckCircle2 className="size-4" />
          {isLoading ? "Saving grade..." : "Save grade"}
        </Button>
      </div>
    </article>
  );
};

export default QuizGradingPanel;
