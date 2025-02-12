"use client";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetCourseByIdQuery } from "@/redux/api/courseApi";
import React, { use } from "react";
import CourseForm from "../../../../../components/features/CourseForm";
import SectionFormDialog from "@/components/features/SectionFormDialog";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import SortableSectionList from "@/components/features/SortableSectionList";
import { cn } from "@/lib/utils";
import { CourseLessonStatus, CourseSectionStatus } from "@prisma/client";
import LessonFormDialog from "@/components/features/LessonFormDialog";
import SortableLessonList from "@/components/features/SortableLessonList";

const CourseEditPage = ({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) => {
  const { courseId } = use(params);
  const { data: courses, isLoading: isDataFetching } =
    useGetCourseByIdQuery(courseId);

  if (isDataFetching) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container my-5">
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
  );
};

export default CourseEditPage;
