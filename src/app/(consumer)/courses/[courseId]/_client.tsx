import { SkeletonText } from "@/components/Skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, VideoIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const CoursePageClient = ({
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

  return (
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
          className="border-border/70 last:border-b-0"
        >
          <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
            <span className="pr-2 text-left">{section.name}</span>
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-1 pb-3">
            {section.lessons.map((lesson) => (
              <Button
                key={lesson.id}
                variant="ghost"
                asChild
                className={cn(
                  "h-auto min-h-10 justify-start rounded-lg px-3 py-2 text-left",
                  lesson.id === lessonId &&
                    "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
                )}
              >
                <Link
                  href={`/courses/${course.id}/lessons/${lesson.id}`}
                  className="justify-between gap-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <VideoIcon className="size-4 flex-shrink-0" />
                    <div
                      className="whitespace-normal leading-snug"
                      title={lesson.name}
                    >
                      {lesson.name}
                    </div>
                  </div>
                  {lesson.isComplete ? (
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="size-3 shrink-0 text-muted-foreground/50" />
                  )}
                </Link>
              </Button>
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default CoursePageClient;

export const CoursePageSkeleton = () => {
  const sectionIds = ["1", "2"];
  return (
    <div className="flex flex-col gap-4">
      <SkeletonText className="w-full h-8" />
      <Accordion type="multiple" defaultValue={sectionIds}>
        {["1", "2"].map((item) => (
          <AccordionItem key={item} value={item}>
            <AccordionTrigger className="text-lg ">
              <SkeletonText className="w-40 h-6" />
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-1">
              {["1", "2", "3"].map((lesson) => (
                <Button
                  key={lesson}
                  variant="ghost"
                  asChild
                  className="justify-start hover:bg-slate-200 hover:cursor-pointer"
                >
                  <div className="justify-between">
                    <div className="flex items-center gap-4">
                      <SkeletonText className="w-4 h-4 rounded-none" />
                      <SkeletonText className="w-24 h-4" />
                    </div>
                    <SkeletonText className="w-4 h-4 rounded-full" />
                  </div>
                </Button>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
