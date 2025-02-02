import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

const CoursesPage = () => {
  return (
    <div className="container my-5">
      <PageHeader title="Courses">
        <Button asChild>
          <Link href="/admin/courses/add">Add Course</Link>
        </Button>
      </PageHeader>
    </div>
  );
};

export default CoursesPage;
