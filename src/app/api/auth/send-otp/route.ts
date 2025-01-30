import { OTPType, PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { OTPVerification } from "@/constants/OTPVerification.constant";
import { sendEmail } from "@/utils/sendEmail";
import { authGuard } from "@/utils/authGuard";

const prisma = new PrismaClient();

export const POST = authGuard(
  catchAsync(async (request: Request) => {
    const { email, otpType } = await request.json();

    // Check if email is provided in the payload or not
    if (!email || !otpType) {
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

    // Generate OTP for the user
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Hash the OTP before saving to the database
    const hashedOtp = await bcrypt.hash(String(otp), 10);

    const isEmailSent = await sendEmail({
      email: email,
      subject: "Your One-Time Password (OTP) for Secure Verification",
      emailTextInHTML: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <h2 style="color: #333;">OTP Verification Code</h2>
      <p>Dear User,</p>
      <p>We received a request to verify your account. Please use the following One-Time Password (OTP) to proceed:</p>
      <p style="font-size: 24px; font-weight: bold; color: #007bff; text-align: center; padding: 10px; border: 2px dashed #007bff; display: inline-block;">${otp}</p>
      <p>This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone for security reasons.</p>
      <p>If you did not request this verification, please ignore this email.</p>
      <br>
      <p>Best Regards,</p>
      <p><strong>Course Platform App</strong></p>
    </div>`,
    });

    if (!isEmailSent.success) {
      return ApiError(500, "Failed to send OTP!");
    }

    // Save the OTP to the database
    const newCreatedOTP = await prisma.oTPVerifications.upsert({
      where: {
        userId_otpType: {
          userId: isUserExist.id,
          otpType: otpType as OTPType,
        },
      },
      update: {
        otpCode: hashedOtp,
        expiresAt: new Date(Date.now() + 600000), // 10 minutes from now
      },
      create: {
        userId: isUserExist.id,
        otpType: otpType as OTPType,
        otpCode: hashedOtp,
        expiresAt: new Date(Date.now() + 600000),
      },
    });

    if (
      !newCreatedOTP ||
      newCreatedOTP.otpCode !== hashedOtp ||
      !newCreatedOTP.expiresAt
    ) {
      return ApiError(500, "Internal Server Error!");
    }

    return sendResponse({
      status: 200,
      message: "OTP sent successfully.",
      success: true,
    });
  }),
);
