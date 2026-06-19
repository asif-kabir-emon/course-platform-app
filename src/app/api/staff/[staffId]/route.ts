import { UserRole, isSuperAdminRole } from "@/constants/UserRole.constant";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/apiError";
import { authGuard } from "@/utils/authGuard";
import { catchAsync } from "@/utils/handleApi";
import { sendResponse } from "@/utils/sendResponse";
import bcrypt from "bcrypt";

export const PATCH = authGuard(
  catchAsync(async (request: Request, context: unknown) => {
      if (!isSuperAdminRole(request.user?.role)) {
        return ApiError(403, "Super admin access is required.");
      }

      const { params } = context as { params: Promise<{ staffId: string }> };
      const { staffId } = await params;
      const { action, password } = await request.json();

      if (
        action !== "disable" &&
        action !== "restore" &&
        action !== "reset_password"
      ) {
        return ApiError(400, "Unsupported staff action.");
      }

      if (action === "reset_password" && String(password || "").length < 8) {
        return ApiError(400, "Password must be at least 8 characters long.");
      }

      const staff = await prisma.users.findUnique({
        where: {
          id: staffId,
        },
      });

      if (!staff || staff.role !== UserRole.admin) {
        return ApiError(404, "Staff account not found.");
      }

      const updatedStaff = await prisma.users.update({
        where: {
          id: staffId,
        },
        data: await getStaffUpdateData(action, password),
        select: {
          id: true,
          email: true,
          role: true,
          isVerified: true,
          isDeleted: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
              imageUrl: true,
            },
          },
        },
      });

      return sendResponse({
        status: 200,
        message:
          action === "disable"
            ? "Staff account disabled successfully."
            : action === "restore"
              ? "Staff account restored successfully."
              : "Staff password reset successfully.",
        success: true,
        data: updatedStaff,
      });
    }),
);

export const DELETE = authGuard(
  catchAsync(async (request: Request, context: unknown) => {
    if (!isSuperAdminRole(request.user?.role)) {
      return ApiError(403, "Super admin access is required.");
    }

    const { params } = context as { params: Promise<{ staffId: string }> };
    const { staffId } = await params;

    const staff = await prisma.users.findUnique({
      where: {
        id: staffId,
      },
    });

    if (!staff || staff.role !== UserRole.admin) {
      return ApiError(404, "Staff account not found.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.userProfiles.deleteMany({
        where: {
          userId: staffId,
        },
      });

      await tx.users.delete({
        where: {
          id: staffId,
        },
      });
    });

    return sendResponse({
      status: 200,
      message: "Staff account deleted successfully.",
      success: true,
    });
  }),
);

const getStaffUpdateData = async (action: string, password?: string) => {
  if (action === "disable") {
    return {
      isDeleted: true,
      deletedAt: new Date(),
    };
  }

  if (action === "restore") {
    return {
      isDeleted: false,
      deletedAt: null,
    };
  }

  return {
    password: await bcrypt.hash(
      String(password),
      Number(process.env.SALT_ROUNDS),
    ),
  };
};
