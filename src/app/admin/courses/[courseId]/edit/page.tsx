"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetCourseByIdQuery } from "@/hooks/course.hook";
import React, { use, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  BookOpen,
  CircleCheck,
  Eye,
  EyeOff,
  FileText,
  Layers3,
  ListFilter,
  Pencil,
  PlusIcon,
  Search,
  Trash2Icon,
  X,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CourseLessonStatus } from "@/constants/CourseLessonStatus.constant";
import { CourseSectionStatus } from "@/constants/CourseSectionStatus.constant";
import SectionFormDialog from "@/features/section/SectionFormDialog";
import SortableSectionList from "@/features/section/SortableSectionList";
import LessonFormDialog from "@/features/lesson/LessonFormDialog";
import SortableLessonList from "@/features/lesson/SortableLessonList";
import CourseForm from "@/features/course/CourseForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActionButton } from "@/components/ActionButton";
import { useDeleteSectionMutation } from "@/hooks/section.hook";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type CourseSection = {
  id: string;
  name: string;
  status: CourseSectionStatus;
  lessons: {
    id: string;
    name: string;
    description: string;
    youtubeVideoId: string;
    status: CourseLessonStatus;
  }[];
};

const CourseEditPage = ({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) => {
  const { courseId } = use(params);
  const { data: courses, isLoading: isDataFetching } =
    useGetCourseByIdQuery(courseId);

  if (isDataFetching) {
    return <CourseEditSkeleton />;
  }

  if (courses.success === false) {
    return (
      <div className="container my-8">
        <div className="border border-l-[5px] border-l-red-600 mb-4 px-4 py-4 rounded-r-md text-sm text-muted-foreground">
          <span>Failed to fetch data. </span>
          <span>{courses.message}</span>
        </div>
      </div>
    );
  }

  const sections = courses.data.sections as CourseSection[];

  return (
    <div className="page-shell space-y-5">
      <section className="surface-panel overflow-hidden bg-card">
        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_32rem] lg:items-end lg:p-6">
          <div className="min-w-0">
            <Badge
              variant="secondary"
              className="mb-3 border border-primary/10 bg-secondary text-primary shadow-sm"
            >
              Course workspace
            </Badge>
            <h1 className="truncate text-2xl font-bold tracking-normal text-foreground sm:text-3xl">
              {courses.data.name}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              Organize the curriculum, control lesson visibility, and keep
              course details ready for learners.
            </p>
          </div>
          <CourseSummary sections={sections} />
        </div>
      </section>

      <Tabs defaultValue="lessons">
        <TabsList className="grid h-11 w-full grid-cols-2 bg-muted/80 sm:w-auto sm:min-w-80">
          <TabsTrigger value="lessons" className="gap-2">
            <BookOpen className="size-4" />
            Curriculum
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-2">
            <FileText className="size-4" />
            Course details
          </TabsTrigger>
        </TabsList>
        <TabsContent value="lessons" className="mt-4">
          <CurriculumEditor courseId={courseId} sections={sections} />
        </TabsContent>
        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Course details</CardTitle>
              <CardDescription>
                Update the title and learner-facing description.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseForm course={courses.data} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const CourseSummary = ({ sections }: { sections: CourseSection[] }) => {
  const lessons = sections.flatMap((section) => section.lessons);
  const publicLessons = lessons.filter(
    (lesson) => lesson.status === CourseLessonStatus.public,
  ).length;
  const previewLessons = lessons.filter(
    (lesson) => lesson.status === CourseLessonStatus.preview,
  ).length;

  const summary = [
    {
      label: "Sections",
      value: sections.length,
      icon: Layers3,
      tone: "text-primary",
    },
    {
      label: "Lessons",
      value: lessons.length,
      icon: BookOpen,
      tone: "text-accent",
    },
    {
      label: "Published",
      value: publicLessons,
      icon: Eye,
      tone: "text-emerald-600",
    },
    {
      label: "Preview",
      value: previewLessons,
      icon: Video,
      tone: "text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {summary.map(({ label, value, icon: Icon, tone }) => (
        <div
          key={label}
          className="flex min-h-20 items-center gap-3 rounded-xl border border-border/70 bg-muted/30 p-3 shadow-sm"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm">
            <Icon className={cn("size-5", tone)} />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
              {label}
            </div>
            <div className="mt-1 text-xl font-bold leading-none">{value}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const CurriculumEditor = ({
  courseId,
  sections,
}: {
  courseId: string;
  sections: CourseSection[];
}) => {
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState<"all" | CourseSectionStatus>(
    "all",
  );
  const [deleteSection, { isLoading: isDeletingSection }] =
    useDeleteSectionMutation();

  const filteredSections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sections.filter((section) => {
      const matchesVisibility =
        visibility === "all" || section.status === visibility;
      const matchesQuery =
        !normalizedQuery ||
        section.name.toLowerCase().includes(normalizedQuery) ||
        section.lessons.some((lesson) =>
          lesson.name.toLowerCase().includes(normalizedQuery),
        );

      return matchesVisibility && matchesQuery;
    });
  }, [query, sections, visibility]);
  const totalLessons = sections.reduce(
    (count, section) => count + section.lessons.length,
    0,
  );
  const isFiltered = query.trim().length > 0 || visibility !== "all";
  const resetFilters = () => {
    setQuery("");
    setVisibility("all");
  };
  const handleDeleteSection = async (id: string) => {
    const toastId = toast.loading("Deleting section ...", {
      duration: 2000,
    });

    try {
      const response = await deleteSection(id).unwrap();

      if (response.success) {
        toast.success(response.message, { id: toastId, duration: 2000 });
      } else {
        toast.error(response.message, { id: toastId, duration: 2000 });
      }
    } catch {
      toast.error("Failed to delete section", { id: toastId, duration: 2000 });
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
        <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
          <div className="flex gap-2">
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <span>Public content is available to enrolled learners.</span>
          </div>
          <div className="flex gap-2">
            <Video className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <span>Preview lessons can be opened before purchase.</span>
          </div>
          <div className="flex gap-2">
            <EyeOff className="mt-0.5 size-4 shrink-0" />
            <span>Private content stays hidden from learners.</span>
          </div>
        </div>
      </div>

      <Card className="min-w-0">
        <CardHeader className="gap-4 border-b border-border/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Course curriculum</CardTitle>
              <CardDescription className="mt-1">
                {sections.length} sections and {totalLessons} lessons in the
                learner-facing sequence.
              </CardDescription>
            </div>
            <div className="grid gap-2 sm:flex sm:items-center">
              {sections.length > 1 && (
                <SectionReorderDialog courseId={courseId} sections={sections} />
              )}
              <SectionFormDialog courseId={courseId}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <PlusIcon />
                    Add section
                  </Button>
                </DialogTrigger>
              </SectionFormDialog>
            </div>
          </div>
          <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_190px_auto]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search sections or lessons"
                className="pl-9"
              />
            </label>
            <label className="relative">
              <ListFilter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Select
                value={visibility}
                onValueChange={(value) =>
                  setVisibility(value as "all" | CourseSectionStatus)
                }
              >
                <SelectTrigger className="h-10 bg-background/80 pl-9">
                  <SelectValue placeholder="All visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All visibility</SelectItem>
                  <SelectItem value={CourseSectionStatus.public}>
                    Public
                  </SelectItem>
                  <SelectItem value={CourseSectionStatus.private}>
                    Private
                  </SelectItem>
                </SelectContent>
              </Select>
            </label>
            {isFiltered && (
              <Button
                type="button"
                variant="ghost"
                className="justify-center"
                onClick={resetFilters}
              >
                <X className="size-4" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-5">
          {sections.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <Layers3 className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">Start with your first section</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add sections first, then place lessons inside each section.
              </p>
              <SectionFormDialog courseId={courseId}>
                <DialogTrigger asChild>
                  <Button className="mt-5">
                    <PlusIcon />
                    Add section
                  </Button>
                </DialogTrigger>
              </SectionFormDialog>
            </div>
          ) : filteredSections.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <Search className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">No matching curriculum</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Adjust your search or show every visibility state.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-5"
                onClick={resetFilters}
              >
                <X className="size-4" />
                Clear filters
              </Button>
            </div>
          ) : (
            <Accordion
              type="multiple"
              defaultValue={filteredSections.slice(0, 1).map(({ id }) => id)}
              className="space-y-3"
            >
              {filteredSections.map((section, index) => (
                <AccordionItem
                  key={section.id}
                  value={section.id}
                  className="overflow-hidden rounded-xl border border-border/80 bg-muted/20 px-4 last:border-b"
                >
                  <AccordionTrigger className="min-w-0 gap-3 py-4 hover:no-underline">
                    <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-xs font-bold text-muted-foreground shadow-sm">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-semibold">
                          {section.name}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{section.lessons.length} lessons</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 capitalize">
                            {section.status === CourseSectionStatus.public ? (
                              <Eye className="size-3.5 text-emerald-600" />
                            ) : (
                              <EyeOff className="size-3.5" />
                            )}
                            {section.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="mb-3 flex flex-col gap-3 border-t pt-4 lg:flex-row lg:items-center lg:justify-between">
                      <p className="text-sm font-medium text-muted-foreground">
                        {section.lessons.length === 0
                          ? "No lessons in this section yet."
                          : `${section.lessons.length} lessons ready to organize.`}
                      </p>
                      <div className="grid gap-2 sm:flex sm:items-center sm:justify-end">
                        <SectionFormDialog
                          courseId={courseId}
                          section={section}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          </DialogTrigger>
                        </SectionFormDialog>
                        {section.lessons.length === 0 && (
                          <ActionButton
                            action={() => {
                              handleDeleteSection(section.id);
                            }}
                            tryAction={isDeletingSection}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground sm:w-auto"
                              aria-label={`Delete ${section.name}`}
                            >
                              <Trash2Icon className="size-4" />
                            </Button>
                          </ActionButton>
                        )}
                        <LessonFormDialog sectionId={section.id}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto"
                            >
                              <PlusIcon />
                              New lesson
                            </Button>
                          </DialogTrigger>
                        </LessonFormDialog>
                      </div>
                    </div>
                    {section.lessons.length > 0 ? (
                      <SortableLessonList
                        sectionId={section.id}
                        lessons={section.lessons}
                      />
                    ) : (
                      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                        This section has no lessons yet.
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const SectionReorderDialog = ({
  courseId,
  sections,
}: {
  courseId: string;
  sections: CourseSection[];
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <ArrowUpDown className="size-4" />
          Reorder
        </Button>
      </DialogTrigger>
      <DialogContent
        hideClose
        className="fixed inset-0 left-0 top-0 flex h-dvh max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:rounded-none"
      >
        <DialogHeader className="shrink-0 border-b bg-background px-5 py-4 text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle>Reorder sections</DialogTitle>
              <DialogDescription className="mt-1">
                Drag sections into the learner-facing order.
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                Done
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-muted/30 px-4 py-5">
          <div className="mx-auto max-w-3xl rounded-xl border bg-card p-3 shadow-sm sm:p-4">
            <SortableSectionList
              courseId={courseId}
              sections={sections}
              showActions={false}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseEditPage;

const CourseEditSkeleton = () => {
  return (
    <div
      className="container my-5 space-y-6"
      aria-label="Loading course editor"
    >
      <Skeleton className="h-8 w-64" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
      {[1, 2, 3].map((item) => (
        <Card key={item}>
          <CardHeader className="flex flex-row items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-28" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((row) => (
              <div
                key={row}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
