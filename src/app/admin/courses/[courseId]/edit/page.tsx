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

  console.log(courses);

  return (
    <div className="container my-5">
      <PageHeader title={courses.data.name} />
      <Tabs defaultValue="lessons">
        <TabsList>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        <TabsContent value="lessons">
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
