"use client";
import { SkeletonText } from "@/components/Skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useGetCourseByIdQuery,
  useGetCourseReviewsQuery,
  useSaveCourseReviewMutation,
} from "@/hooks/course.hook";
import { useGetCompletedLessonsQuery } from "@/hooks/lesson.hook";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Pencil,
  PlayCircle,
  Star,
} from "lucide-react";
import Link from "next/link";
import React, { use, useEffect, useState } from "react";
import { mapCourse } from "./courseMapper";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useClientSession } from "@/hooks/useClientSession";
import { isAdminRole } from "@/constants/UserRole.constant";

const CoursePage = ({ params }: { params: Promise<{ courseId: string }> }) => {
  const { courseId } = use(params);
  const { data: course, isLoading: isFetchingCourseData } =
    useGetCourseByIdQuery(courseId);
  const { data: completedLessons, isLoading: isFetchingCompletedLessonData } =
    useGetCompletedLessonsQuery({});

  if (isFetchingCourseData || isFetchingCompletedLessonData) {
    return <ProductSkeleton />;
  }

  if (course.success === false) {
    return (
      <div className="container my-5">
        <div className="border border-l-[5px] border-l-red-600 mb-4 px-4 py-4 rounded-r-md text-sm text-muted-foreground">
          Failed to fetch data. Try to refresh the page.
          <div className="text-red-500">Error: {course.message}</div>
        </div>
      </div>
    );
  }

  const mappedCourse = mapCourse({
    course: course.data,
    completedLessonIds: completedLessons.data,
  });
  const lessonCount = mappedCourse.sections.reduce(
    (total, section) => total + section.lessons.length,
    0,
  );
  const completedCount = mappedCourse.sections.reduce(
    (total, section) =>
      total + section.lessons.filter((lesson) => lesson.isComplete).length,
    0,
  );

  return (
    <div className="space-y-6">
      <section className="surface-panel overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5 sm:p-7">
          <Badge variant="secondary" className="mb-3">
            Course overview
          </Badge>
          <h1 className="max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
            {course.data.name}
          </h1>
          <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
            {course.data.description}
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5">
              <BookOpen className="size-4 text-primary" />
              {mappedCourse.sections.length} sections
            </span>
            <span className="flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5">
              <PlayCircle className="size-4 text-primary" />
              {lessonCount} lessons
            </span>
            <span className="flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5">
              <CheckCircle2 className="size-4 text-emerald-600" />
              {completedCount} completed
            </span>
          </div>
        </div>
      </section>

      <div>
        <h2 className="text-xl font-semibold">Course curriculum</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a lesson to continue learning.
        </p>
      </div>
      <CourseDetailWithSessionLesson course={mappedCourse} />
      <CourseReviews courseId={courseId} />
    </div>
  );
};

const CourseReviews = ({ courseId }: { courseId: string }) => {
  const { data, isLoading } = useGetCourseReviewsQuery(courseId);
  const [saveReview, { isLoading: isSaving }] = useSaveCourseReviewMutation();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isEditingReview, setIsEditingReview] = useState(true);
  const reviewsData = data?.success ? data.data : undefined;
  const { session } = useClientSession();
  const isAdmin = isAdminRole(session?.role);

  useEffect(() => {
    if (reviewsData?.currentUserReview) {
      setRating(reviewsData.currentUserReview.rating);
      setComment(reviewsData.currentUserReview.comment || "");
      setIsEditingReview(false);
    }
  }, [reviewsData]);

  const handleSave = async () => {
    try {
      const response = await saveReview({
        courseId,
        rating,
        comment,
      }).unwrap();
      if (response.success) {
        toast.success(response.message);
        setIsEditingReview(false);
      } else {
        toast.error(response.message);
      }
    } catch {
      toast.error("Failed to save your review.");
    }
  };

  if (isLoading) {
    return <SkeletonText className="h-44 w-full" />;
  }

  if (!reviewsData) {
    return (
      <section className="surface-panel p-5 sm:p-6">
        <h2 className="text-xl font-semibold">Learner reviews</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Reviews are temporarily unavailable. The rest of the course remains
          available.
        </p>
      </section>
    );
  }

  return (
    <section className="surface-panel p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Learner reviews</h2>
          <div className="mt-2 flex items-center gap-2">
            <Star className="size-5 fill-amber-400 text-amber-400" />
            <span className="text-lg font-bold">
              {Number(reviewsData.averageRating || 0).toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">
              from {reviewsData.reviewCount || 0} reviews
            </span>
          </div>
        </div>
        {isAdmin ? (
          <div className="w-full max-w-xl rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
            Reviews are displayed in preview mode. Admin accounts cannot submit
            learner reviews.
          </div>
        ) : (
          <div className="w-full max-w-xl rounded-2xl bg-muted/40 p-4">
            {reviewsData.currentUserReview && !isEditingReview ? (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Your review</p>
                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                          key={value}
                          className={cn(
                            "size-5 text-muted-foreground/30",
                            value <= rating && "fill-amber-400 text-amber-400",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingReview(true)}
                  >
                    <Pencil className="size-4" />
                    Review again
                  </Button>
                </div>
                {comment && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {comment}
                  </p>
                )}
              </div>
            ) : (
              <>
                <label className="text-sm font-medium">Your rating</label>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      aria-label={`${value} star rating`}
                      className="rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <Star
                        className={cn(
                          "size-6 text-muted-foreground/40",
                          value <= rating && "fill-amber-400 text-amber-400",
                        )}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Share what helped you most..."
                  maxLength={2000}
                  className="mt-3 min-h-24"
                />
                <div className="mt-3 flex gap-2">
                  {reviewsData.currentUserReview && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRating(reviewsData.currentUserReview.rating);
                        setComment(reviewsData.currentUserReview.comment || "");
                        setIsEditingReview(false);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button onClick={handleSave} disabled={isSaving}>
                    {reviewsData.currentUserReview
                      ? "Update review"
                      : "Submit review"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {reviewsData.reviews?.length > 0 && (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {reviewsData.reviews
            .slice(0, 6)
            .map(
              (review: {
                id: string;
                rating: number;
                comment?: string;
                author: string;
              }) => (
                <article key={review.id} className="rounded-2xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{review.author}</span>
                    <span className="flex items-center gap-1 text-sm">
                      <Star className="size-4 fill-amber-400 text-amber-400" />
                      {review.rating}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                </article>
              ),
            )}
        </div>
      )}
    </section>
  );
};

export default CoursePage;

const CourseDetailWithSessionLesson = ({
  course,
}: {
  course: {
    id: string;
    name: string;
    sections: {
      id: string;
      name: string;
      lessons: {
        id: string;
        name: string;
        isComplete: boolean;
      }[];
    }[];
  };
}) => {
  return (
    <div className="space-y-4">
      {course.sections.map(
        (sections: {
          id: string;
          name: string;
          lessons: {
            id: string;
            name: string;
            isComplete: boolean;
          }[];
        }) => (
          <section key={sections.id} className="surface-panel p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-semibold">{sections.name}</h3>
              <Badge variant="secondary">
                {sections.lessons.length} lessons
              </Badge>
            </div>
            <div className="space-y-2">
              {sections.lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/courses/${course.id}/lessons/${lesson.id}`}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border border-transparent bg-muted/50 px-3 py-3 hover:border-primary/15 hover:bg-primary/5",
                    lesson.isComplete && "bg-emerald-500/5",
                  )}
                >
                  {lesson.isComplete ? (
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="size-5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="min-w-0 flex-1 font-medium group-hover:text-primary">
                    {lesson.name}
                  </span>
                  <PlayCircle className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </section>
        ),
      )}
    </div>
  );
};

const ProductSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="surface-panel space-y-3 p-6">
        <SkeletonText className="h-6 w-32" />
        <SkeletonText className="h-8 w-2/3" />
        <SkeletonText className="h-4 w-full" />
        <SkeletonText className="h-4 w-1/2" />
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="surface-panel w-full p-4" key={index}>
            <div className="flex-1 space-y-2 py-1">
              <SkeletonText className="h-5 w-40" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div className="flex items-center gap-3" key={index}>
                    <SkeletonText className="size-5 rounded-full" />
                    <SkeletonText className="h-4 w-48" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
