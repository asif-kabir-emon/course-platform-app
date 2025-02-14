"use client";
import React, { use } from "react";

const CoursePage = ({ params }: { params: Promise<{ courseId: string }> }) => {
  const { courseId } = use(params);

  console.log(courseId);

  return <div className="container my-5">{courseId}</div>;
};

export default CoursePage;
