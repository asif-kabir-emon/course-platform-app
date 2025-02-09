import { useGetCoursesQuery } from "@/redux/api/courseApi";
import React from "react";

const CourseTable = () => {
  const { data: courses, isLoading: isFetchingData } = useGetCoursesQuery({});

  if (isFetchingData) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Courses</h1>
      <table className="table-auto w-full">
        <thead>
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Description</th>
          </tr>
        </thead>
        <tbody>
          {courses?.data?.map(
            (course: { id: string; name: string; description: string }) => (
              <tr key={course.id}>
                <td className="border px-4 py-2">{course.name}</td>
                <td className="border px-4 py-2">{course.description}</td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CourseTable;
