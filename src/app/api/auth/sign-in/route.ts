import { PrismaClient } from "@prisma/client";
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

  // Check is user already exists with the provided email or not
  const isUserExist = await prisma.users.findUnique({
    where: {
      email: email,
    },
  });

  if (!isUserExist) {
    return ApiError(404, "User not found! Please Create an account.");
  }

  // Check if user is verified or not before login
  if (isUserExist && !isUserExist.isVerified) {
    // return ApiError(404, "User not verified!");
    return sendResponse({
      status: 401,
      message: "User not verified!",
      success: false,
      data: {
        accessToken: "",
        isVerified: isUserExist.isVerified,
      },
    });
  }

  // Check if password is correct or not
  const isPasswordValid = await bcrypt.compare(
    password,
    String(isUserExist?.password),
  );

  if (!isPasswordValid) {
    return ApiError(401, "Incorrect Credential!");
  }

  // Generate JWT token for the user
  const payload = { id: isUserExist.id, email: isUserExist.email };
  const jwtSecret = String(process.env.JWT_SECRET) || "";
  const jwtExpiresIn = String(process.env.JWT_EXPIRES_IN) || "1h";
  const token = createToken(payload, jwtSecret, { expiresIn: jwtExpiresIn });

  if (!token) {
    return ApiError(500, "Internal Server Error!");
  }

  return sendResponse({
    status: 200,
    message: "Signed in successfully!",
    success: true,
    data: {
      accessToken: token,
      isVerified: isUserExist.isVerified,
    },
  });
});
