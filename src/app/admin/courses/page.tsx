"use client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import CourseTable from "./CourseTable";

const CoursesPage = () => {
  return (
    <div className="container my-5">
      <PageHeader title="Courses">
        <Button asChild>
          <Link href="/admin/courses/add">Add Course</Link>
        </Button>
      </PageHeader>
      <CourseTable />
    </div>
  );
};

export default CoursesPage;
