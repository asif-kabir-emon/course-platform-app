"use client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetCourseByIdQuery } from "@/redux/api/courseApi";
import React, { use } from "react";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CourseLessonStatus } from "@/constants/CourseLessonStatus.constant";
import { CourseSectionStatus } from "@/constants/CourseSectionStatus.constant";
import SectionFormDialog from "@/features/section/SectionFormDialog";
import SortableSectionList from "@/features/section/SortableSectionList";
import LessonFormDialog from "@/features/lesson/LessonFormDialog";
import SortableLessonList from "@/features/lesson/SortableLessonList";
import CourseForm from "@/features/course/CourseForm";
import { Skeleton } from "@/components/ui/skeleton";

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

  return (
    <div className="container my-5">
      <div className="lg:hidden flex justify-center items-center h-96 text-muted-foreground">
        Open this page on a larger screen to edit course details.
      </div>

      <div className="hidden lg:block">
        <PageHeader title={courses.data.name} />
        <Tabs defaultValue="lessons">
          <TabsList>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <TabsContent value="lessons" className="flex flex-col gap-2">
            <Card>
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Sections</CardTitle>
                <SectionFormDialog courseId={courseId}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="hover:bg-black hover:text-white"
                    >
                      <PlusIcon />
                      Add Section
                    </Button>
                  </DialogTrigger>
                </SectionFormDialog>
              </CardHeader>
              <CardContent>
                <SortableSectionList
                  courseId={courseId}
                  sections={courses.data.sections}
                />
              </CardContent>
            </Card>
            {courses.data.sections.length > 0 && <hr className="my-2" />}
            {courses.data.sections.map(
              (section: {
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
              }) => (
                <Card key={section.id}>
                  <CardHeader className="flex flex-row justify-between items-center gap-4">
                    <CardTitle
                      className={cn(
                        "flex items-center gap-1",
                        section.status === CourseSectionStatus.private &&
                          "text-muted-foreground",
                      )}
                    >
                      <span className="mx-2">{section.name}</span>
                    </CardTitle>
                    <LessonFormDialog sectionId={section.id}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="hover:bg-black hover:text-white"
                        >
                          <PlusIcon />
                          New Lesson
                        </Button>
                      </DialogTrigger>
                    </LessonFormDialog>
                  </CardHeader>
                  <CardContent>
                    <SortableLessonList
                      sectionId={section.id}
                      lessons={section.lessons}
                    />
                  </CardContent>
                </Card>
              ),
            )}
          </TabsContent>
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CourseForm course={courses.data} />
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CourseEditPage;

const CourseEditSkeleton = () => {
  return (
    <div className="container my-5 space-y-6" aria-label="Loading course editor">
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
