import { prisma } from "@/lib/prisma";
import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";
import { isAdminRole } from "@/constants/UserRole.constant";
import { Prisma } from "@prisma/client";


export const POST = authGuard(
  catchAsync(async (request: Request) => {
    const user = request.user;
    const { name, description } = await request.json();
    console.log(user);

    // Check if user is authenticated or not
    if (user && !isAdminRole(user.role)) {
      return ApiError(401, "Unauthorized access!");
    }

    // Check if name and description are provided in the payload or not
    if (!name || !description) {
      return ApiError(400, "Invalid payload!");
    }

    // Create a new course
    const newCourse = await prisma.courses.create({
      data: {
        name,
        description,
      },
    });

    if (!newCourse) {
      return ApiError(500, "Failed to create course!");
    }

    return sendResponse({
      status: 200,
      message: "New course added successfully!",
      success: true,
      data: newCourse,
    });
  }),
);

export const GET = catchAsync(async (request: Request) => {
  const searchParams = new URL(request.url).searchParams;
  const paginate = searchParams.get("paginate") === "true";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize")) || 10),
  );
  const search = searchParams.get("search")?.trim() || "";
  const where: Prisma.CoursesWhereInput = {
    isDeleted: false,
    ...(search ? { name: { contains: search } } : {}),
  };

  const [courses, total] = await Promise.all([
    prisma.courses.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...(paginate ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      include: {
        userCourseAccess: true,
        sections: {
          include: {
            lessons: true,
          },
        },
      },
    }),
    prisma.courses.count({ where }),
  ]);

  if (!courses) {
    return ApiError(404, "No courses found!");
  }

  const responseData =
    courses.length > 0
      ? courses?.map((course) => ({
          id: course.id,
          name: course.name,
          description: course.description,
          sectionsCount: course.sections.length,
          lessonsCount: course.sections.reduce(
            (count, section) => count + section.lessons.length,
            0,
          ),
          studentCount: course.userCourseAccess.length,
          isDeleted: course.isDeleted,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
        }))
      : [];

  return sendResponse({
    status: 200,
    message: "Courses fetched successfully!",
    success: true,
    meta: {
      count: courses.length,
      total,
      page: paginate ? page : 1,
      pageSize: paginate ? pageSize : total || pageSize,
      totalPages: paginate ? Math.max(1, Math.ceil(total / pageSize)) : 1,
    },
    data: responseData,
  });
});
