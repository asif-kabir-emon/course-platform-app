import { SkeletonText } from "@/components/Skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, VideoIcon } from "lucide-react";
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
    >
      {course.sections.map((section) => (
        <AccordionItem key={section.id} value={section.id}>
          <AccordionTrigger className="text-base">
            {section.name}
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-1">
            {section.lessons.map((lesson) => (
              <Button
                key={lesson.id}
                variant="ghost"
                asChild
                className={cn(
                  "justify-start hover:bg-neutral-800",
                  lesson.id === lessonId &&
                    "bg-neutral-700 text-accent-foreground",
                )}
              >
                <Link
                  href={`/courses/${course.id}/lessons/${lesson.id}`}
                  className="justify-between"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <VideoIcon className="flex-shrink-0" />
                    <div className="whitespace-wrap" title={lesson.name}>
                      {lesson.name}
                    </div>
                  </div>
                  {lesson.isComplete && <CheckCircle2 />}
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
