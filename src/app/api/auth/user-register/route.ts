import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { createToken } from "@/utils/jwtToken";

const prisma = new PrismaClient();

export const POST = catchAsync(async (request: Request) => {
  const { email, password } = await request.json();

  // Check if email and password are provided in the payload or not
  if (!email || !password) {
    return ApiError(400, "Invalid payload!");
  }

  // Check if password is at least 8 characters long
  if (password.length < 8) {
    return ApiError(400, "Password must be at least 8 characters long!");
  }

  // Check is user already exists with the provided email or not
  const isUserExist = await prisma.users.findUnique({
    where: {
      email: email,
      isVerified: true,
    },
  });

  if (isUserExist) {
    return ApiError(404, "Already have an account with this email!");
  }

  // Hash the password
  const hashed_password = await bcrypt.hash(
    password,
    Number(process.env.SALT_ROUNDS),
  );

  // Create a new user
  const newUser = await prisma.$transaction(
    async (tsc: Prisma.TransactionClient) => {
      const createdUser = await tsc.users.create({
        data: {
          email: email,
          password: hashed_password,
        },
      });

      await tsc.userProfiles.create({
        data: {
          email: createdUser.email,
          userId: createdUser.id,
        },
      });

      return createdUser;
    },
  );

  if (!newUser) {
    return ApiError(400, "Failed to create user!");
  }

  // Generate JWT token for the user
  const payload = { id: newUser.id, email: newUser.email };
  const jwtSecret = String(process.env.JWT_SECRET) || "";
  const jwtExpiresIn = String(process.env.JWT_EXPIRES_IN) || "1h";
  const token = createToken(payload, jwtSecret, { expiresIn: jwtExpiresIn });

  if (!token) {
    return ApiError(500, "Internal Server Error!");
  }

  return sendResponse({
    status: 200,
    message: "Successfully Created an account.",
    success: true,
    data: {
      accessToken: token,
    },
  });
});
