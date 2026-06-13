/* eslint-disable @typescript-eslint/no-explicit-any */
import { CourseLessonStatus } from "@/constants/CourseLessonStatus.constant";
import { CourseSectionStatus } from "@/constants/CourseSectionStatus.constant";
import { prisma } from "@/lib/prisma";
import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";
import { isAdminRole } from "@/constants/UserRole.constant";


export const PUT = authGuard(
  catchAsync(async (request: Request, context: any) => {
    const params = await context.params;
    const user = request.user;
    const courseId = params.course;
    const { name, description } = await request.json();

    // Check if user is authenticated or not
    if (user && !isAdminRole(user.role)) {
      return ApiError(401, "Unauthorized access!");
    }

    // Check if name and description are provided in the payload or not
    if (!name || !description) {
      return ApiError(400, "Invalid payload!");
    }

    // Check if course exists
    const course = await prisma.courses.findUnique({
      where: {
        id: courseId,
      },
    });

    if (!course) {
      return ApiError(404, "Course not found!");
    }

    // Create a new course
    const updateCourse = await prisma.courses.update({
      where: {
        id: courseId,
      },
      data: {
        name,
        description,
      },
    });

    if (!updateCourse) {
      return ApiError(500, "Failed to update course!");
    }

    return sendResponse({
      status: 200,
      message: "Course updated successfully!",
      success: true,
      data: updateCourse,
    });
  }),
);

export const DELETE = authGuard(
  catchAsync(async (request: Request, context: any) => {
    const params = await context.params;
    const user = request.user;
    const courseId = params.course;

    // Check if user is authenticated or not
    if (user && !isAdminRole(user.role)) {
      return ApiError(401, "Unauthorized access!");
    }

    // Check if course exists
    const course = await prisma.courses.findUnique({
      where: {
        id: courseId,
      },
      include: {
        sections: true,
      },
    });

    if (!course) {
      return ApiError(404, "Course not found!");
    }

    if (course.sections.length > 0) {
      return ApiError(400, "Course has sections. Please delete them first!");
    }

    // Delete course
    const deleteCourse = await prisma.courses.delete({
      where: {
        id: courseId,
      },
    });

    if (!deleteCourse) {
      return ApiError(500, "Failed to update course!");
    }

    return sendResponse({
      status: 200,
      message: "Course updated successfully!",
      success: true,
      data: deleteCourse,
    });
  }),
);

export const GET = authGuard(
  catchAsync(async (request: Request, context: any) => {
    const params = await context.params;
    const user = request.user;
    const courseId = params.course;

    // Check if user is authenticated or not
    if (!user || !user.id || !user.email || !user.role) {
      return ApiError(401, "Unauthorized access!");
    }

    // Check is user enrolled in the course or not
    const isEnrolled = await prisma.userCourseAccess.findFirst({
      where: {
        userId: user.id,
        courseId: courseId,
      },
    });

    if (!isEnrolled && !isAdminRole(user.role)) {
      return ApiError(401, "Unauthorized access!");
    }

    let course;

    // Check if course exists
    if (isAdminRole(user.role)) {
      course = await prisma.courses.findUnique({
        where: {
          id: courseId,
        },
        include: {
          sections: {
            orderBy: { order: "asc" },
            include: {
              lessons: {
                orderBy: { order: "asc" },
              },
            },
          },
        },
      });
    } else {
      course = await prisma.courses.findUnique({
        where: {
          id: courseId,
        },
        include: {
          sections: {
            where: {
              status: CourseSectionStatus.public,
            },
            orderBy: { order: "asc" },
            include: {
              lessons: {
                where: {
                  status: {
                    not: CourseLessonStatus.private,
                  },
                },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      });
    }

    if (!course) {
      return ApiError(404, "Course not found!");
    }

    return sendResponse({
      status: 200,
      message: "Course fetched successfully!",
      success: true,
      data: course,
    });
  }),
);
