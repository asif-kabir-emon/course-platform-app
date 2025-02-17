import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const GET = authGuard(
  catchAsync(async (request: Request) => {
    const user = request.user;

    // Check if user is authenticated or not
    if (!user || !user.id || !user.email) {
      return ApiError(401, "Unauthorized access!");
    }

    // Check if user exists with
    const userData = await prisma.users.findFirst({
      where: {
        id: user.id,
        email: user.email,
      },
      include: {
        profile: true,
        userCourseAccess: true,
        purchaseHistories: true,
      },
    });

    // Check if product exists
    if (!userData) {
      return ApiError(404, "User not found!");
    }

    return sendResponse({
      status: 200,
      message: "User access checked successfully!",
      success: true,
      data: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        isDeleted: userData.isDeleted,
        profile: userData.profile,
        userCourseAccess: userData.userCourseAccess,
        purchaseHistories: userData.purchaseHistories,
      },
    });
  }),
);

export const PUT = authGuard(
  catchAsync(async (request: Request) => {
    const user = request.user;
    const { firstName, lastName, imageUrl } = await request.json();

    // Check firstName, lastName, and imageUrl exist
    if (!firstName || !lastName) {
      return ApiError(401, "Unauthorized access!");
    }

    // Update user profile
    const updatedUser = await prisma.userProfiles.update({
      where: {
        userId: user?.id,
      },
      data: {
        firstName: firstName,
        lastName: lastName,
        imageUrl: imageUrl || "",
      },
    });

    if (!updatedUser) {
      return ApiError(403, "User is deleted!");
    }

    return sendResponse({
      status: 200,
      message: "User access checked successfully!",
      success: true,
      data: updatedUser,
    });
  }),
);
