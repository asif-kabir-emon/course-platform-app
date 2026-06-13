import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPlural } from "@/lib/formatter";
import {
  useDeleteCourseMutation,
  useGetCoursesQuery,
} from "@/redux/api/courseApi";
import Link from "next/link";
import React from "react";
import { Trash2Icon } from "lucide-react";
import { ActionButton } from "@/components/ActionButton";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/Skeleton";

const CourseTable = () => {
  const { data: courses, isLoading: isFetchingData } = useGetCoursesQuery({});
  const [deleteCourse, { isLoading: isDeletingCourse }] =
    useDeleteCourseMutation();

  if (isFetchingData) {
    return <TableSkeleton columns={3} />;
  }

  if (courses?.success === false) {
    return null;
  }

  const handleDeleteCourse = async (id: string) => {
    const toastId = toast.loading("Deleting course...", {
      duration: 2000,
    });
    try {
      const response = await deleteCourse(id).unwrap();

      if (response.success) {
        toast.success(response.message, { id: toastId, duration: 2000 });
      } else {
        toast.error(response.message, { id: toastId, duration: 2000 });
      } // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Failed to delete course!", { id: toastId, duration: 2000 });
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[250px]">
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
        </TableHeader>
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
                      {" • "}
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
                    <Button>
                      <Link href={`/admin/courses/${course.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                    <ActionButton
                      action={() => {
                        handleDeleteCourse(course.id);
                      }}
                      tryAction={isDeletingCourse}
                    >
                      <Button
                        variant="outline"
                        className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2Icon />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </ActionButton>
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
