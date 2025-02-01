import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { createToken } from "@/utils/jwtToken";
import { OTPVerification } from "@/constants/OTPVerification.constant";

const prisma = new PrismaClient();

export const POST = catchAsync(async (request: Request) => {
  const { email, otpCode, otpType } = await request.json();

  // Check if email and password are provided in the payload or not
  if (!email || !otpCode || !otpType) {
    return ApiError(400, "Invalid payload!");
  }

  // Check if OTP type is valid or not
  if (
    ![
      OTPVerification.email,
      OTPVerification.phone,
      OTPVerification.login,
      OTPVerification.forgotPassword,
    ].includes(otpType)
  ) {
    return ApiError(400, "Invalid OTP type!");
  }

  // Check is user already exists with the provided email or not
  const isUserExist = await prisma.users.findUnique({
    where: {
      email: email,
    },
  });

  if (!isUserExist) {
    return ApiError(404, "User not found!");
  }

  // Check if OTP is found or not
  const isOTPExist = await prisma.oTPVerifications.findFirst({
    where: {
      userId: isUserExist.id,
      otpType: otpType,
    },
  });

  if (!isOTPExist) {
    return ApiError(404, "OTP not found!");
  }

  // Check if OTP is expired or not
  const isOTPExpired = new Date() > isOTPExist?.expiresAt;

  if (isOTPExpired) {
    return ApiError(400, "OTP is expired! Please request a new OTP.");
  }

  // Check if password is correct or not
  const isGiveOtpCodeValid = await bcrypt.compare(
    otpCode,
    String(isOTPExist?.otpCode),
  );

  if (!isGiveOtpCodeValid) {
    return ApiError(401, "Incorrect OTP!");
  }

  // Update the user profile
  if (otpType === OTPVerification.email) {
    const updateUser = await prisma.users.update({
      where: {
        id: isUserExist.id,
      },
      data: {
        isVerified: true,
      },
    });

    if (!updateUser) {
      return ApiError(400, "Failed to update user!");
    }
  }

  // Delete the OTP
  await prisma.oTPVerifications.delete({
    where: {
      id: isOTPExist.id,
    },
  });

  // Generate JWT token for the user
  const payload = {
    id: isUserExist.id,
    email: isUserExist.email,
    role: isUserExist.role,
    verified: true,
  };
  const jwtSecret = String(process.env.JWT_SECRET) || "";
  const jwtExpiresIn = String(process.env.JWT_EXPIRES_IN) || "1h";
  const token = createToken(payload, jwtSecret, { expiresIn: jwtExpiresIn });

  if (!token) {
    return ApiError(500, "Internal Server Error!");
  }

  return sendResponse({
    status: 200,
    message: "OTP verified successfully. Signed in successfully!",
    success: true,
    data: {
      accessToken: token,
    },
  });
});
