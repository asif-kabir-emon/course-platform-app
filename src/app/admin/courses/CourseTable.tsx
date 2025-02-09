import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { formatPlural } from "@/lib/formatPlural";
import { useGetCoursesQuery } from "@/redux/api/courseApi";
import Link from "next/link";
import React from "react";

const CourseTable = () => {
  const { data: courses, isLoading: isFetchingData } = useGetCoursesQuery({});

  if (isFetchingData) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Table>
        <TableRow>
          <TableHead>
            {formatPlural(
              courses?.data?.length,
              {
                singular: "course",
                plural: "courses",
              },
              {
                includeCount: false,
              },
            )}
          </TableHead>
          <TableHead>Students</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
        <TableBody>
          {courses?.data?.map(
            (course: {
              id: string;
              name: string;
              description: string;
              studentCount: number;
              sectionsCount: number;
              lessonsCount: number;
            }) => (
              <TableRow key={course.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="font-semibold">{course.name}</div>
                    <div className="text-muted-foreground">
                      {formatPlural(
                        course.sectionsCount,
                        {
                          singular: "section",
                          plural: "sections",
                        },
                        {
                          includeCount: true,
                        },
                      )}
                      •{" "}
                      {formatPlural(
                        course.lessonsCount,
                        {
                          singular: "lesson",
                          plural: "lessons",
                        },
                        {
                          includeCount: true,
                        },
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{course.studentCount}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button asChild>
                      <Link href={`/admin/courses/${course.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                    <Button asChild className="btn btn-sm btn-danger">
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ),
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CourseTable;
