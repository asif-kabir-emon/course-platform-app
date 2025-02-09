import { PrismaClient } from "@prisma/client";
import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";
import { UserRole } from "@/constants/UserRole.constant";

const prisma = new PrismaClient();

export const PUT = authGuard(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catchAsync(async (request: Request, context: any) => {
    const user = request.user;
    const courseId = context.params.course;
    const { name, description } = await request.json();

    // Check if user is authenticated or not
    if (user && user.role !== UserRole.admin) {
      return ApiError(401, "Unauthorized access!");
    }

    // Check if email and password are provided in the payload or not
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catchAsync(async (request: Request, context: any) => {
    const user = request.user;
    const courseId = context.params.course;

    // Check if user is authenticated or not
    if (user && user.role !== UserRole.admin) {
      return ApiError(401, "Unauthorized access!");
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

    // Delete course
    const deleteCourse = await prisma.courses.update({
      where: {
        id: courseId,
      },
      data: {
        isDeleted: true,
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
