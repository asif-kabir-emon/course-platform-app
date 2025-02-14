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
    const isUserExist = await prisma.users.findFirst({
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

    if (!isUserExist) {
      return ApiError(404, "User not found!");
    }

    const purchaseHistories = await prisma.purchaseHistories.findMany({
      where: {
        userId: user.id,
      },
    });

    return sendResponse({
      status: 200,
      message: "Purchase histories fetched successfully!",
      success: true,
      data: purchaseHistories,
    });
  }),
);
