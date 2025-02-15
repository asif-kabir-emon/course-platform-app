"use client";
import PageHeader from "@/components/PageHeader";
import { useGetCourseByIdQuery } from "@/redux/api/courseApi";
import React, { use } from "react";

const CoursePage = ({ params }: { params: Promise<{ courseId: string }> }) => {
  const { courseId } = use(params);
  const { data: course, isLoading } = useGetCourseByIdQuery(courseId);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (course.success === false) {
    return <div>Failed to fetch data. Try to refresh the page.</div>;
  }

  return (
    <div className="container my-5">
      <PageHeader title={course.data.name} className="mb-2" />
      <p className="text-muted-foreground">{course.data.description}</p>
    </div>
  );
};

export default CoursePage;
