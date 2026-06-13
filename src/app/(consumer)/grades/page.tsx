"use client";

import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/formatter";
import { cn } from "@/lib/utils";
import { useGetMyGradesQuery } from "@/redux/api/learningApi";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Hourglass,
  Target,
  XCircle,
} from "lucide-react";
import Link from "next/link";

type GradeAttempt = {
  id: string;
  status:
    | "submitted"
    | "timed_out"
    | "pending_review"
    | "graded";
  score: number;
  passed: boolean;
  earnedPoints: number;
  totalPoints: number;
  startedAt: string;
  submittedAt?: string | null;
  gradedAt?: string | null;
  feedback?: string | null;
  assessment: {
    title: string;
    kind: "quiz" | "exam";
    passingScore: number;
    isGradable: boolean;
  };
  lesson: { id: string; name: string };
  course: { id: string; name: string };
  manualGrades: {
    questionId: string;
    prompt: string;
    earnedPoints: number | null;
    possiblePoints: number;
  }[];
};

const GradesPage = () => {
  const { data, isLoading } = useGetMyGradesQuery({});
  const grades = data?.success ? data.data : null;

  return (
    <div className="container my-5 space-y-6 sm:my-8">
      <div>
        <PageHeader title="Grades" className="mb-0 sm:mb-0" />
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Review quiz and exam results, pending grading, earned points, and
          instructor feedback.
        </p>
      </div>

      {isLoading ? (
        <GradesSkeleton />
      ) : !grades || grades.attempts.length === 0 ? (
        <EmptyGrades />
      ) : (
        <>
          <GradeSummary summary={grades.summary} />
          <div className="space-y-4">
            {grades.attempts.map((attempt: GradeAttempt) => (
              <GradeCard key={attempt.id} attempt={attempt} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const GradeSummary = ({
  summary,
}: {
  summary: {
    totalAttempts: number;
    gradedAttempts: number;
    pendingReview: number;
    passedAttempts: number;
    averageScore: number | null;
  };
}) => {
  const items = [
    {
      label: "Attempts",
      value: summary.totalAttempts,
      icon: GraduationCap,
      tone: "text-primary",
    },
    {
      label: "Average score",
      value:
        summary.averageScore === null ? "Not graded" : `${summary.averageScore}%`,
      icon: Target,
      tone: "text-sky-600",
    },
    {
      label: "Passed",
      value: summary.passedAttempts,
      icon: Award,
      tone: "text-emerald-600",
    },
    {
      label: "Pending review",
      value: summary.pendingReview,
      icon: Hourglass,
      tone: "text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, icon: Icon, tone }) => (
        <Card key={label}>
          <CardContent className="flex min-h-24 items-center gap-3 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Icon className={cn("size-5", tone)} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 truncate text-xl font-bold">{value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const GradeCard = ({ attempt }: { attempt: GradeAttempt }) => {
  const status = getStatus(attempt);
  const StatusIcon = status.icon;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20 pb-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-primary">
              {attempt.course.name}
            </p>
            <CardTitle className="mt-2 text-lg leading-snug">
              {attempt.assessment.title}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {attempt.lesson.name}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn("w-fit gap-1.5", status.className)}
          >
            <StatusIcon className="size-3.5" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <GradeValue
            label="Score"
            value={
              attempt.status === "pending_review" ||
              !attempt.assessment.isGradable
                ? "Pending"
                : `${attempt.score}%`
            }
          />
          <GradeValue
            label="Points"
            value={`${attempt.earnedPoints} / ${attempt.totalPoints}`}
          />
          <GradeValue
            label={
              attempt.gradedAt
                ? "Graded"
                : attempt.submittedAt
                  ? "Submitted"
                  : "Started"
            }
            value={formatDate(
              attempt.gradedAt || attempt.submittedAt || attempt.startedAt,
            )}
          />
        </div>

        {attempt.feedback && (
          <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
            <p className="text-sm font-semibold text-primary">
              Instructor feedback
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {attempt.feedback}
            </p>
          </div>
        )}

        {attempt.manualGrades.length > 0 && (
          <details className="group rounded-xl border p-4">
            <summary className="cursor-pointer list-none font-medium">
              Written answer grading
            </summary>
            <div className="mt-4 space-y-3 border-t pt-4">
              {attempt.manualGrades.map((grade, index) => (
                <div
                  key={grade.questionId}
                  className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <p className="text-sm">
                    {index + 1}. {grade.prompt}
                  </p>
                  <span className="shrink-0 text-sm font-semibold">
                    {grade.earnedPoints === null
                      ? "Pending"
                      : `${grade.earnedPoints} / ${grade.possiblePoints}`}
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}

        <Button variant="outline" asChild>
          <Link
            href={`/courses/${attempt.course.id}/lessons/${attempt.lesson.id}`}
          >
            Return to lesson
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

const GradeValue = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl bg-muted/40 p-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
    <p className="mt-1 font-semibold">{value}</p>
  </div>
);

const getStatus = (attempt: GradeAttempt) => {
  if (attempt.status === "pending_review") {
    return {
      label: "Pending review",
      icon: Clock3,
      className: "border-amber-500/30 bg-amber-500/10 text-amber-700",
    };
  }
  if (attempt.status === "timed_out") {
    return {
      label: "Time expired",
      icon: Clock3,
      className: "border-amber-500/30 bg-amber-500/10 text-amber-700",
    };
  }
  if (!attempt.assessment.isGradable) {
    return {
      label: "Submitted",
      icon: CheckCircle2,
      className: "border-primary/30 bg-primary/5 text-primary",
    };
  }
  if (attempt.passed) {
    return {
      label: "Passed",
      icon: CheckCircle2,
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
    };
  }

  return {
    label: "Not passed",
    icon: XCircle,
    className: "border-destructive/30 bg-destructive/5 text-destructive",
  };
};

const EmptyGrades = () => (
  <div className="surface-panel flex min-h-72 flex-col items-center justify-center px-5 py-10 text-center">
    <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <GraduationCap className="size-7" />
    </span>
    <h2 className="mt-4 text-xl font-semibold">No grades available yet</h2>
    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
      Quiz and exam submissions will appear here after you finish an attempt.
    </p>
    <Button asChild className="mt-5">
      <Link href="/courses">Continue learning</Link>
    </Button>
  </div>
);

const GradesSkeleton = () => (
  <div className="space-y-5">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-24 rounded-2xl border skeleton-shimmer"
        />
      ))}
    </div>
    {[1, 2].map((item) => (
      <div
        key={item}
        className="h-72 rounded-2xl border skeleton-shimmer"
      />
    ))}
  </div>
);

export default GradesPage;
