import { UserRole, isSuperAdminRole } from "@/constants/UserRole.constant";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/apiError";
import { authGuard } from "@/utils/authGuard";
import { catchAsync } from "@/utils/handleApi";
import { sendResponse } from "@/utils/sendResponse";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";

const staffSelect = {
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
};

export const GET = authGuard(
  catchAsync(async (request: Request) => {
    if (!isSuperAdminRole(request.user?.role)) {
      return ApiError(403, "Super admin access is required.");
    }

    const staff = await prisma.users.findMany({
      where: {
        role: UserRole.admin,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: staffSelect,
    });

    return sendResponse({
      status: 200,
      message: "Staff accounts fetched successfully.",
      success: true,
      data: staff,
    });
  }),
);

export const POST = authGuard(
  catchAsync(async (request: Request) => {
    if (!isSuperAdminRole(request.user?.role)) {
      return ApiError(403, "Super admin access is required.");
    }

    const { email, password, firstName, lastName, phone } =
      await request.json();
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail || !password || !firstName || !lastName) {
      return ApiError(400, "Enter first name, last name, email, and password.");
    }

    if (String(password).length < 8) {
      return ApiError(400, "Password must be at least 8 characters long.");
    }

    const existingUser = await prisma.users.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return ApiError(400, "An account already exists with this email.");
    }

    const hashedPassword = await bcrypt.hash(
      String(password),
      Number(process.env.SALT_ROUNDS),
    );

    const staff = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const createdUser = await tx.users.create({
          data: {
            email: normalizedEmail,
            password: hashedPassword,
            role: UserRole.admin,
            isVerified: true,
          },
        });

        await tx.userProfiles.create({
          data: {
            userId: createdUser.id,
            email: createdUser.email,
            firstName,
            lastName,
            phone: phone || undefined,
            isEmailVerified: true,
          },
        });

        return tx.users.findUnique({
          where: {
            id: createdUser.id,
          },
          select: staffSelect,
        });
      },
    );

    return sendResponse({
      status: 201,
      message: "Staff account created successfully.",
      success: true,
      data: staff,
    });
  }),
);
