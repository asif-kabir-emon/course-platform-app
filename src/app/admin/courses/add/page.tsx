"use client";
import PageHeader from "@/components/PageHeader";
import React from "react";
import CourseForm from "./CourseForm";

const NewCoursePage = () => {
  return (
    <div className="container my-5">
      <PageHeader title="New Course" />
      <CourseForm />
    </div>
  );
};

export default NewCoursePage;
