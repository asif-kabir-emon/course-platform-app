import { PrismaClient } from "@prisma/client";
import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";
import { UserRole } from "@/constants/UserRole.constant";

const prisma = new PrismaClient();

export const POST = authGuard(
  catchAsync(async (request: Request) => {
    const user = request.user;
    const { name, description } = await request.json();
    console.log(user);

    // Check if user is authenticated or not
    if (user && user.role !== UserRole.admin) {
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

export const GET = catchAsync(async () => {
  const courses = await prisma.courses.findMany({
    include: {
      userCourseAccess: true,
      sections: {
        include: {
          lessons: true,
        },
      },
    },
  });

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
    },
    data: responseData,
  });
});
