import { SkeletonText } from "@/components/Skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Check,
  CircleHelp,
  FileText,
  PanelLeftClose,
  Play,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const CoursePageClient = ({
  course,
  onCollapse,
}: {
  course: {
    id: string;
    name: string;
    sections: {
      id: string;
      name: string;
      completedLessonsCount?: number;
      isComplete?: boolean;
      lessons: {
        id: string;
        name: string;
        type?: "video" | "text" | "quiz";
        isComplete: boolean;
      }[];
    }[];
  };
  onCollapse?: () => void;
}) => {
  const { lessonId } = useParams();
  const [openSection, setOpenSection] = useState<string | undefined>();

  useEffect(() => {
    if (typeof lessonId === "string") {
      const section = course.sections.find((section) =>
        section.lessons.some((lesson) => lesson.id === lessonId),
      );
      setOpenSection(section ? section.id : undefined);
    } else {
      setOpenSection(course.sections[0]?.id || undefined);
    }
  }, [lessonId, course.sections]);

  // Calculate overall course progress
  const totalLessons = course.sections.reduce(
    (acc, section) => acc + section.lessons.length,
    0,
  );
  const completedLessons = course.sections.reduce(
    (acc, section) => acc + (section.completedLessonsCount ?? 0),
    0,
  );
  const percentComplete =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Sidebar Header */}
      <div className="px-5 py-4 border-b border-border bg-[#f8fafc]/50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Course content
            </span>
            <h2 className="mt-0.5 text-base font-bold text-foreground leading-snug truncate" title={course.name}>
              {course.name}
            </h2>
          </div>
          {onCollapse && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="-mr-2 -mt-1 size-8 shrink-0 hover:bg-slate-100 rounded-lg"
              onClick={onCollapse}
              aria-label="Collapse course content sidebar"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="size-4 text-slate-500" />
            </Button>
          )}
        </div>

        {/* Progress Section */}
        <div className="mt-3.5">
          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span>{percentComplete}% Complete</span>
            <span className="text-slate-500">{completedLessons}/{totalLessons} lessons</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="max-h-[calc(100vh-210px)] overflow-y-auto">
        <Accordion
          type="single"
          collapsible
          value={openSection}
          onValueChange={setOpenSection}
          className="w-full"
        >
          {course.sections.map((section) => (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="border-b border-border/60 last:border-b-0"
            >
              <AccordionTrigger className="px-5 py-4 text-sm font-semibold hover:no-underline hover:bg-slate-50/50 transition-colors [&[data-state=open]]:bg-slate-50/30">
                <span className="min-w-0 flex-1 pr-2 text-left">
                  {(() => {
                    const match = section.name.match(/^(Section\s+\d+|Week\s+\d+|Module\s+\d+):\s*(.*)$/i);
                    const subtitle = (match && match[1]) ? match[1] : `Section ${course.sections.indexOf(section) + 1}`;
                    const title = (match && match[2]) ? match[2] : section.name;
                    return (
                      <>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                          {subtitle}
                        </div>
                        <div className="flex min-w-0 items-start gap-1.5">
                          <span
                            className={cn(
                              "min-w-0 text-[14px] font-bold leading-snug text-slate-800",
                              section.isComplete && "text-emerald-700",
                            )}
                          >
                            {title}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                  <span className="mt-1 block text-xs font-semibold text-slate-500">
                    {section.completedLessonsCount ?? 0}/{section.lessons.length} lessons
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="flex flex-col pb-0">
                {section.lessons.map((lesson) => {
                  const isActive = lesson.id === lessonId;
                  return (
                    <Button
                      key={lesson.id}
                      variant="ghost"
                      asChild
                      className={cn(
                        "h-auto min-h-12 w-full justify-start whitespace-normal rounded-none border-l-[3px] border-y-0 border-r-0 px-5 py-3 text-left transition-all",
                        isActive
                          ? "border-primary bg-primary/5 text-primary hover:bg-primary/5 font-semibold"
                          : "border-transparent text-slate-600 hover:bg-slate-100/50 hover:text-slate-900",
                      )}
                    >
                      <Link
                        href={`/courses/${course.id}/lessons/${lesson.id}`}
                        className="flex items-start gap-3 w-full"
                      >
                        {/* Status bullet on the left */}
                        {lesson.isComplete ? (
                          <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                            <Check className="size-3.5 stroke-[3px]" />
                          </div>
                        ) : (
                          <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-slate-500">
                            {lesson.type === "text" ? (
                              <FileText className="size-3" />
                            ) : lesson.type === "quiz" ? (
                              <CircleHelp className="size-3" />
                            ) : (
                              <Play className="size-3 fill-current" />
                            )}
                          </div>
                        )}

                        {/* Title and Content type details */}
                        <div className="flex-1 min-w-0 flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {lesson.type === "text"
                              ? "Reading"
                              : lesson.type === "quiz"
                                ? "Quiz"
                                : "Video"}
                          </span>
                          <span
                            className={cn(
                              "text-[13px] font-medium leading-snug text-slate-700 mt-0.5",
                              isActive && "text-primary font-semibold",
                            )}
                          >
                            {lesson.name}
                          </span>
                        </div>
                      </Link>
                    </Button>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default CoursePageClient;

export const CoursePageSkeleton = () => {
  const sectionIds = ["1", "2"];
  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header Skeleton */}
      <div className="px-5 py-4 border-b border-border">
        <SkeletonText className="h-3 w-20 mb-2" />
        <SkeletonText className="h-5 w-48 mb-4" />
        <div className="mt-2">
          <div className="flex justify-between mb-1.5">
            <SkeletonText className="h-3 w-16" />
            <SkeletonText className="h-3 w-20" />
          </div>
          <SkeletonText className="h-1.5 w-full rounded-full" />
        </div>
      </div>

      {/* Accordion Skeletons */}
      <div className="flex-1">
        <Accordion type="multiple" defaultValue={sectionIds}>
          {["1", "2"].map((item) => (
            <AccordionItem key={item} value={item} className="border-b border-border/60">
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <div className="flex flex-col gap-1.5 w-full text-left">
                  <SkeletonText className="h-3 w-14" />
                  <SkeletonText className="h-4 w-40" />
                  <SkeletonText className="h-3 w-24 mt-1" />
                </div>
              </AccordionTrigger>
              <AccordionContent className="flex flex-col pb-0">
                {["1", "2"].map((lesson) => (
                  <div
                    key={lesson}
                    className="flex items-start gap-3 w-full px-5 py-3 border-l-[3px] border-transparent"
                  >
                    {/* Left circle skeleton */}
                    <div className="mt-0.5 size-6 shrink-0 rounded-full bg-muted animate-pulse" />

                    {/* Text lines skeletons */}
                    <div className="flex-1 flex flex-col gap-1">
                      <SkeletonText className="h-3 w-12" />
                      <SkeletonText className="h-3.5 w-32 mt-0.5" />
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};
