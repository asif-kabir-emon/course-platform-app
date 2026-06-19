import { Button } from "@/components/ui/button";
import PaginationControls from "@/components/PaginationControls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPlural } from "@/lib/formatter";
import { useGetCoursesQuery } from "@/hooks/course.hook";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Copy,
  MoreVertical,
  Pencil,
  RotateCcw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/Skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import MobileFilterDialog from "@/components/MobileFilterDialog";

const CourseTable = () => {
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput.trim());
  const { data: courses, isLoading: isFetchingData } = useGetCoursesQuery({
    paginate: true,
    page,
    pageSize,
    search,
  });

  useEffect(() => {
    setPage(1);
  }, [search]);

  if (isFetchingData) {
    return <TableSkeleton columns={3} />;
  }

  if (!courses || courses.success === false) {
    return null;
  }

  return (
    <div className="space-y-4">
      <MobileFilterDialog
        activeFilterCount={Number(searchInput.trim().length > 0)}
        title="Filter courses"
        description="Search the course catalog by name."
      >
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search courses..."
            aria-label="Search courses"
            className="h-11 pl-9"
          />
        </label>
        {searchInput.trim() && (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setSearchInput("")}
          >
            <RotateCcw className="size-4" />
            Reset filters
          </Button>
        )}
      </MobileFilterDialog>
      <div className="hidden gap-3 sm:flex">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search courses..."
            aria-label="Search courses"
            className="h-11 pl-9"
          />
        </label>
        {searchInput.trim() && (
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => setSearchInput("")}
          >
            <RotateCcw className="size-4" />
            Reset
          </Button>
        )}
      </div>
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
              <TableHead className="w-[1%] whitespace-nowrap text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-44 text-center">
                  <p className="font-medium">No courses match your search.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try a broader course name or reset the filter.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              courses.data.map(
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
                    <TableCell className="w-[1%] whitespace-nowrap text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-none text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            aria-label={`Open actions for ${course.name}`}
                          >
                            <MoreVertical />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel>Course actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            asChild
                            className="focus:bg-primary/10 focus:text-primary"
                          >
                            <Link href={`/admin/courses/${course.id}/edit`}>
                              <Pencil />
                              Manage curriculum
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            asChild
                            className="focus:bg-primary/10 focus:text-primary"
                          >
                            <Link href={`/courses/${course.id}`}>
                              <BookOpen />
                              Open learner view
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="focus:bg-primary/10 focus:text-primary"
                            onSelect={() => {
                              void navigator.clipboard.writeText(course.id);
                              toast.success("Course ID copied.");
                            }}
                          >
                            <Copy />
                            Copy course ID
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ),
              )
            )}
          </TableBody>
        </Table>
        <PaginationControls
          page={courses.meta.page}
          totalPages={courses.meta.totalPages}
          total={courses.meta.total}
          pageSize={courses.meta.pageSize}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default CourseTable;
