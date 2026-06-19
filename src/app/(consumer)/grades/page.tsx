"use client";

import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/formatter";
import { cn } from "@/lib/utils";
import { useGetMyGradesQuery } from "@/hooks/learning.hook";
import {
  ArrowRight,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock3,
  GraduationCap,
  Hourglass,
  Layers3,
  XCircle,
} from "lucide-react";
import Link from "next/link";

type GradeStrategy = "highest" | "latest" | "average" | "first";

type GradeAttempt = {
  id: string;
  number: number;
  status: "submitted" | "timed_out" | "pending_review" | "graded";
  score: number;
  passed: boolean;
  earnedPoints: number;
  totalPoints: number;
  isValidGrade: boolean;
  startedAt: string;
  submittedAt?: string | null;
  gradedAt?: string | null;
  feedback?: string | null;
  manualGrades: {
    questionId: string;
    prompt: string;
    earnedPoints: number | null;
    possiblePoints: number;
  }[];
};

type GradeAssessment = {
  id: string;
  title: string;
  kind: "quiz" | "exam";
  passingScore: number;
  gradeStrategy: GradeStrategy;
  isGradable: boolean;
  finalScore: number | null;
  passed: boolean | null;
  pendingReview: boolean;
  attemptCount: number;
  validAttemptCount: number;
  lesson: { id: string; name: string };
  course: { id: string; name: string };
  attempts: GradeAttempt[];
};

type CourseGrade = {
  id: string;
  name: string;
  summary: {
    totalAttempts: number;
    totalAssessments: number;
    gradedAssessments: number;
    pendingReview: number;
    passedAssessments: number;
    averageScore: number | null;
  };
  assessments: GradeAssessment[];
};

const strategyLabels: Record<GradeStrategy, string> = {
  highest: "Highest attempt",
  latest: "Latest attempt",
  average: "Average of attempts",
  first: "First attempt",
};

const GradesPage = () => {
  const { data, isLoading } = useGetMyGradesQuery({});
  const grades = data?.success ? data.data : null;

  return (
    <div className="container my-5 space-y-6 sm:my-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <PageHeader title="Grades" className="mb-0 sm:mb-0" />
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Review your grades by course, with each assessment calculated from
            its attempt history using the instructor&apos;s selected method.
          </p>
        </div>
        {!isLoading && grades?.summary.totalAssessments > 0 && (
          <p className="text-sm text-muted-foreground">
            {grades.courses.length} course
            {grades.courses.length === 1 ? "" : "s"} with grades
          </p>
        )}
      </div>

      {isLoading ? (
        <GradesSkeleton />
      ) : !grades || grades.courses.length === 0 ? (
        <EmptyGrades />
      ) : (
        <>
          <GradeSummary
            summary={grades.summary}
            courseCount={grades.courses.length}
          />
          <div className="space-y-4">
            {grades.courses.map((course: CourseGrade) => (
              <CourseGradeCard key={course.id} course={course} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const GradeSummary = ({
  summary,
  courseCount,
}: {
  summary: {
    totalAttempts: number;
    totalAssessments: number;
    gradedAssessments: number;
    pendingReview: number;
    passedAssessments: number;
    averageScore: number | null;
  };
  courseCount: number;
}) => {
  const items = [
    {
      label: "Courses",
      value: courseCount,
      helper: `${summary.totalAssessments} assessments`,
      icon: Layers3,
      tone: "text-primary",
    },
    {
      label: "Overall average",
      value:
        summary.averageScore === null
          ? "Not graded"
          : `${summary.averageScore}%`,
      helper: "From calculated final grades",
      icon: BarChart3,
      tone: "text-sky-600",
    },
    {
      label: "Passed",
      value: summary.passedAssessments,
      helper: `${summary.gradedAssessments} assessments graded`,
      icon: Award,
      tone: "text-emerald-600",
    },
    {
      label: "Pending review",
      value: summary.pendingReview,
      helper: "Needs instructor grading",
      icon: Hourglass,
      tone: "text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, helper, icon: Icon, tone }) => (
        <Card key={label} className="shadow-sm">
          <CardContent className="flex min-h-28 items-center gap-3 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Icon className={cn("size-5", tone)} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 truncate text-xl font-bold">{value}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {helper}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const CourseGradeCard = ({ course }: { course: CourseGrade }) => (
  <Card className="overflow-hidden shadow-sm">
    <CardContent className="p-0">
      <div className="border-b bg-gradient-to-r from-primary/10 via-background to-sky-500/10 p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="secondary">Course grade</Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">
              {course.name}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {course.summary.gradedAssessments} of{" "}
              {course.summary.totalAssessments} assessments graded •{" "}
              {course.summary.totalAttempts} total attempts
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:min-w-[420px]">
            <CourseMetric
              label="Average"
              value={
                course.summary.averageScore === null
                  ? "Pending"
                  : `${course.summary.averageScore}%`
              }
            />
            <CourseMetric
              label="Passed"
              value={`${course.summary.passedAssessments}/${course.summary.gradedAssessments}`}
            />
            <CourseMetric label="Review" value={course.summary.pendingReview} />
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {course.assessments.map((assessment) => (
          <AssessmentCard key={assessment.id} assessment={assessment} />
        ))}
      </div>
    </CardContent>
  </Card>
);

const CourseMetric = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="rounded-2xl border bg-background/80 p-3 shadow-sm">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
    <p className="mt-1 text-xl font-bold">{value}</p>
  </div>
);

const AssessmentCard = ({ assessment }: { assessment: GradeAssessment }) => {
  const status = getAssessmentStatus(assessment);
  const StatusIcon = status.icon;

  return (
    <div className="overflow-hidden rounded-2xl border bg-background">
      <CardContent className="p-0">
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="uppercase">
                {assessment.kind}
              </Badge>
              <Badge
                variant="outline"
                className={cn("gap-1.5", status.className)}
              >
                <StatusIcon className="size-3.5" />
                {status.label}
              </Badge>
            </div>
            <h3 className="mt-4 text-lg font-semibold leading-snug">
              {assessment.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {assessment.lesson.name}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <span>
                <strong>{assessment.attemptCount}</strong>{" "}
                <span className="text-muted-foreground">attempts</span>
              </span>
              <span>
                <strong>{strategyLabels[assessment.gradeStrategy]}</strong>{" "}
                <span className="text-muted-foreground">counts</span>
              </span>
              <span>
                <strong>{assessment.passingScore}%</strong>{" "}
                <span className="text-muted-foreground">to pass</span>
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-muted/40 p-4 text-left lg:text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Final grade
            </p>
            <p className="mt-1 text-3xl font-bold">
              {!assessment.isGradable
                ? "Complete"
                : assessment.finalScore === null
                  ? "Pending"
                  : `${assessment.finalScore}%`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {assessment.validAttemptCount} valid graded attempt
              {assessment.validAttemptCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="border-t bg-muted/15 px-5 py-4 sm:px-6">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <span className="font-medium">
                Attempt history
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  Scores, points, dates, and feedback
                </span>
              </span>
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-4 space-y-3">
              {assessment.attempts.map((attempt) => (
                <AttemptRow key={attempt.id} attempt={attempt} />
              ))}
            </div>
          </details>
          <Button variant="outline" size="sm" asChild className="mt-4">
            <Link
              href={`/courses/${assessment.course.id}/lessons/${assessment.lesson.id}`}
            >
              Return to lesson
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </div>
  );
};

const AttemptRow = ({ attempt }: { attempt: GradeAttempt }) => {
  const status = getAttemptStatus(attempt);

  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Attempt {attempt.number}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDate(
              attempt.gradedAt || attempt.submittedAt || attempt.startedAt,
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className={cn("font-medium", status.className)}>
            {status.label}
          </span>
          <span>
            {attempt.isValidGrade ? `${attempt.score}%` : "Not calculated"}
          </span>
          <span className="text-muted-foreground">
            {attempt.totalPoints > 0
              ? `${attempt.earnedPoints} / ${attempt.totalPoints} points`
              : "Legacy attempt"}
          </span>
        </div>
      </div>

      {attempt.feedback && (
        <div className="mt-3 rounded-lg bg-primary/5 p-3 text-sm">
          <span className="font-medium text-primary">
            Instructor feedback:{" "}
          </span>
          <span className="whitespace-pre-wrap text-muted-foreground">
            {attempt.feedback}
          </span>
        </div>
      )}

      {attempt.manualGrades.length > 0 && (
        <div className="mt-3 space-y-2 border-t pt-3">
          {attempt.manualGrades.map((grade, index) => (
            <div
              key={grade.questionId}
              className="flex flex-col gap-1 text-sm sm:flex-row sm:justify-between"
            >
              <span>
                {index + 1}. {grade.prompt}
              </span>
              <strong className="shrink-0">
                {grade.earnedPoints === null
                  ? "Pending"
                  : `${grade.earnedPoints} / ${grade.possiblePoints}`}
              </strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const getAssessmentStatus = (assessment: GradeAssessment) => {
  if (assessment.pendingReview && assessment.finalScore === null) {
    return {
      label: "Pending review",
      icon: Clock3,
      className: "border-amber-500/30 bg-amber-500/10 text-amber-700",
    };
  }
  if (!assessment.isGradable) {
    return {
      label: "Completed",
      icon: CheckCircle2,
      className: "border-primary/30 bg-primary/5 text-primary",
    };
  }
  if (assessment.finalScore === null) {
    return {
      label: "Awaiting grade",
      icon: Clock3,
      className: "border-muted-foreground/30 text-muted-foreground",
    };
  }
  if (assessment.passed) {
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

const getAttemptStatus = (attempt: GradeAttempt) => {
  if (attempt.status === "pending_review") {
    return { label: "Pending review", className: "text-amber-700" };
  }
  if (attempt.status === "timed_out") {
    return { label: "Time expired", className: "text-amber-700" };
  }
  if (!attempt.isValidGrade) {
    return { label: "Excluded", className: "text-muted-foreground" };
  }
  return attempt.passed
    ? { label: "Passed", className: "text-emerald-700" }
    : { label: "Not passed", className: "text-destructive" };
};

const EmptyGrades = () => (
  <div className="surface-panel flex min-h-72 flex-col items-center justify-center px-5 py-10 text-center">
    <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <GraduationCap className="size-7" />
    </span>
    <h2 className="mt-4 text-xl font-semibold">No grades available yet</h2>
    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
      Quiz and exam results will appear here after you finish an attempt.
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
        <div key={item} className="h-28 rounded-2xl border skeleton-shimmer" />
      ))}
    </div>
    {[1, 2].map((item) => (
      <div key={item} className="h-64 rounded-2xl border skeleton-shimmer" />
    ))}
  </div>
);

export default GradesPage;
