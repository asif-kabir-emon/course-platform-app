import bcrypt from "bcrypt";
import { authGuard } from "./../../../../utils/authGuard";
import { PrismaClient } from "@prisma/client";
import { catchAsync } from "@/utils/handleApi";
import { ApiError } from "@/utils/apiError";
import { sendResponse } from "@/utils/sendResponse";

const prisma = new PrismaClient();

export const POST = authGuard(
  catchAsync(async (request: Request) => {
    const user = request.user;
    const { requestType, oldPassword, newPassword } = await request.json();

    if (user === undefined) {
      return ApiError(401, "Unauthorized access!");
    }

    if (
      !requestType ||
      !["change_password", "forgot_password"].includes(requestType) ||
      !newPassword
    ) {
      return ApiError(400, "Invalid payload!");
    }

    if (requestType == "change_password") {
      if (!oldPassword || !newPassword) {
        return ApiError(400, "Invalid payload!");
      }
    }

    if (newPassword.length < 8) {
      return ApiError(400, "Password must be at least 8 characters long!");
    }

    const isUserExist = await prisma.users.findUnique({
      where: {
        id: user.id,
        email: user.email,
        isVerified: true,
      },
    });

    if (!isUserExist) {
      return ApiError(404, "User not found!");
    }

    if (requestType == "change_password") {
      const isPasswordMatch = await bcrypt.compare(
        oldPassword,
        isUserExist.password,
      );

      if (!isPasswordMatch) {
        return ApiError(400, "Old password is incorrect!");
      }

      if (oldPassword === newPassword) {
        return ApiError(
          400,
          "New password cannot be the same as the old password!",
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.users.update({
        where: {
          id: user.id,
        },
        data: {
          password: hashedPassword,
        },
      });

      return sendResponse({
        status: 200,
        message: "Password updated successfully!",
        success: true,
      });
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.users.update({
        where: {
          id: user.id,
        },
        data: {
          password: hashedPassword,
        },
      });

      return sendResponse({
        status: 200,
        message: "Password updated successfully!",
        success: true,
      });
    }
  }),
);
