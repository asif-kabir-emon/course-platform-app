"use client";
import PageHeader from "@/components/PageHeader";
import CourseForm from "@/features/CourseForm";
import React from "react";

const NewCoursePage = () => {
  return (
    <div className="container my-5">
      <PageHeader title="New Course" />
      <CourseForm />
    </div>
  );
};

export default NewCoursePage;
