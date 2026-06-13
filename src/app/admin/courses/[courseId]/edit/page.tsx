"use client";
import PageHeader from "@/components/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetCourseByIdQuery } from "@/redux/api/courseApi";
import React, { use, useMemo, useState } from "react";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ChevronDown,
  Eye,
  EyeOff,
  Layers3,
  ListFilter,
  PlusIcon,
  Search,
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
    <div className="container my-5 space-y-5 sm:my-8">
      <section className="overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-accent/10 shadow-sm">
        <div className="p-5 sm:p-7">
          <Badge variant="secondary" className="mb-3">
            Course workspace
          </Badge>
          <PageHeader title={courses.data.name} />
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            Organize the curriculum, control lesson visibility, and keep course
            details ready for learners.
          </p>
          <CourseSummary sections={sections} />
        </div>
      </section>

      <Tabs defaultValue="lessons">
        <TabsList className="grid h-11 w-full grid-cols-2 sm:w-auto sm:min-w-64">
          <TabsTrigger value="lessons">Curriculum</TabsTrigger>
          <TabsTrigger value="details">Course details</TabsTrigger>
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
    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {summary.map(({ label, value, icon: Icon, tone }) => (
        <div
          key={label}
          className="rounded-2xl border border-white/60 bg-white/75 p-4 shadow-sm backdrop-blur"
        >
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Icon className={cn("size-4", tone)} />
            {label}
          </div>
          <div className="mt-2 text-2xl font-bold">{value}</div>
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

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="min-w-0">
        <CardHeader className="gap-4 border-b border-border/70">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Course curriculum</CardTitle>
              <CardDescription className="mt-1">
                Expand a section to manage lessons. Drag items to reorder them.
              </CardDescription>
            </div>
            <SectionFormDialog courseId={courseId}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <PlusIcon />
                  Add section
                </Button>
              </DialogTrigger>
            </SectionFormDialog>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px]">
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
              <select
                value={visibility}
                onChange={(event) =>
                  setVisibility(
                    event.target.value as "all" | CourseSectionStatus,
                  )
                }
                className="h-10 w-full appearance-none rounded-lg border border-input bg-white/80 pl-9 pr-8 text-sm shadow-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
              >
                <option value="all">All visibility</option>
                <option value={CourseSectionStatus.public}>Public</option>
                <option value={CourseSectionStatus.private}>Private</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </label>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-5">
          {filteredSections.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <BookOpen className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">No matching curriculum</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Adjust the search or visibility filter.
              </p>
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
                  className="overflow-hidden rounded-2xl border border-border/80 bg-muted/20 px-4 last:border-b"
                >
                  <AccordionTrigger className="gap-3 py-4 hover:no-underline">
                    <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-background text-xs font-bold text-muted-foreground shadow-sm">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-semibold">
                          {section.name}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{section.lessons.length} lessons</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
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
                    <div className="mb-3 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-muted-foreground">
                        Manage lessons in this section.
                      </p>
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

      <aside className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Section order</CardTitle>
            <CardDescription>
              Drag sections into the learner-facing order.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-4 sm:px-4">
            <SortableSectionList courseId={courseId} sections={sections} />
          </CardContent>
        </Card>
        <Card className="border-primary/15 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Publishing guide</CardTitle>
            <CardDescription className="leading-6">
              Public lessons are available to enrolled learners. Preview lessons
              can be opened before purchase. Private content stays hidden.
            </CardDescription>
          </CardHeader>
        </Card>
      </aside>
    </div>
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
