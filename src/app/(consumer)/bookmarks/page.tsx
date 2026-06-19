"use client";

import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useGetMyBookmarksQuery,
  useRemoveBookmarkMutation,
} from "@/hooks/learning.hook";
import { formatDate } from "@/lib/formatter";
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  FileText,
  HelpCircle,
  Trash2,
  Video,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type BookmarkItem = {
  id: string;
  createdAt: string;
  lesson: {
    id: string;
    name: string;
    type: "video" | "text" | "quiz";
    description?: string | null;
    sectionName: string;
    courseId: string;
    courseName: string;
  };
};

const BookmarksPage = () => {
  const { data, isLoading } = useGetMyBookmarksQuery({});
  const [removeBookmark, { isLoading: isRemoving }] =
    useRemoveBookmarkMutation();
  const bookmarks: BookmarkItem[] = data?.success ? data.data : [];

  const remove = async (lessonId: string) => {
    try {
      const response = await removeBookmark(lessonId).unwrap();
      toast[response.success ? "success" : "error"](response.message);
    } catch {
      toast.error("Unable to remove this bookmark.");
    }
  };

  return (
    <div className="container my-5 space-y-5 sm:my-8">
      <PageHeader title="Bookmarks" className="mb-0 sm:mb-0">
        {bookmarks.length > 0 && (
          <Badge variant="secondary">
            {bookmarks.length} saved{" "}
            {bookmarks.length === 1 ? "lesson" : "lessons"}
          </Badge>
        )}
      </PageHeader>
      <p className="max-w-2xl text-sm text-muted-foreground">
        Return to lessons you saved for review, practice, or later reading.
      </p>

      {isLoading ? (
        <BookmarkSkeleton />
      ) : bookmarks.length === 0 ? (
        <EmptyBookmarks />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {bookmarks.map((bookmark) => {
            const Icon =
              bookmark.lesson.type === "video"
                ? Video
                : bookmark.lesson.type === "text"
                  ? FileText
                  : HelpCircle;

            return (
              <Card key={bookmark.id} className="flex min-w-0 flex-col">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <Badge variant="outline" className="capitalize">
                      {bookmark.lesson.type}
                    </Badge>
                  </div>
                  <div className="pt-3">
                    <p className="truncate text-xs font-semibold uppercase tracking-wide text-primary">
                      {bookmark.lesson.courseName}
                    </p>
                    <CardTitle className="mt-2 line-clamp-2 leading-snug">
                      {bookmark.lesson.name}
                    </CardTitle>
                    <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
                      {bookmark.lesson.sectionName}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  {bookmark.lesson.description && (
                    <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {bookmark.lesson.description}
                    </p>
                  )}
                  <p className="mt-4 text-xs text-muted-foreground">
                    Saved {formatDate(bookmark.createdAt)}
                  </p>
                </CardContent>
                <CardFooter className="grid grid-cols-[1fr_auto] gap-2">
                  <Button asChild>
                    <Link
                      href={`/courses/${bookmark.lesson.courseId}/lessons/${bookmark.lesson.id}`}
                    >
                      Open lesson
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={isRemoving}
                    aria-label={`Remove ${bookmark.lesson.name} bookmark`}
                    onClick={() => void remove(bookmark.lesson.id)}
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

const EmptyBookmarks = () => (
  <div className="surface-panel flex min-h-72 flex-col items-center justify-center px-5 py-10 text-center">
    <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <Bookmark className="size-7" />
    </span>
    <h2 className="mt-4 text-xl font-semibold">No bookmarked lessons yet</h2>
    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
      Use the Bookmark lesson button inside any enrolled lesson to build your
      review list.
    </p>
    <Button asChild className="mt-5">
      <Link href="/courses">
        <BookOpen className="size-4" />
        Browse my courses
      </Link>
    </Button>
  </div>
);

const BookmarkSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {[1, 2, 3].map((item) => (
      <div
        key={item}
        className="h-64 rounded-2xl border bg-card skeleton-shimmer"
      />
    ))}
  </div>
);

export default BookmarksPage;
