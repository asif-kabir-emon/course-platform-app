import { OTPType, PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { OTPVerification } from "@/constants/OTPVerification.constant";
import { sendEmail } from "@/utils/sendEmail";
import { createToken } from "@/utils/jwtToken";

const prisma = new PrismaClient();

export const POST = catchAsync(async (request: Request) => {
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

  if (otpType === OTPVerification.forgotPassword) {
    if (!isUserExist.isVerified) {
      return ApiError(401, "User not verified!");
    }

    // Generate JWT token for the user
    const payload = { id: isUserExist.id, email: isUserExist.email };
    const jwtSecret = String(process.env.JWT_SECRET) || "";
    const jwtExpiresIn = "1h";
    const token = createToken(payload, jwtSecret, { expiresIn: jwtExpiresIn });

    if (!token) {
      return ApiError(500, "Internal Server Error!");
    }

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    const isEmailSent = await sendEmail({
      email: email,
      subject: "Reset Your Password – Secure Link Inside",
      emailTextInHTML: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Dear User,</p>
        <p>We received a request to reset your password for your account.</p>
        <p>If you initiated this request, please click the button below to reset your password: </p>
        <p style="margin-top: 20px; margin-bottom: 40px;">
          <a href="${resetLink}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </p>
        <p>If the button above does not work, you can also copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; background-color: #eee; padding: 10px; border-radius: 5px;">${resetLink}</p>
        <p>This link is valid for <strong>1 hour</strong>. If you did not request a password reset, please ignore this email. No changes will be made to your account.</p>
        <br>
        <p>Best Regards,</p>
        <p><strong>${process.env.APP_NAME} Support Team</strong></p>
      </div>`,
    });

    if (!isEmailSent.success) {
      return ApiError(500, "Failed to send password reset link!");
    }

    return sendResponse({
      status: 200,
      message:
        "Password reset link send successfully. Please check your email.",
      success: true,
    });
  } else if (otpType === OTPVerification.email) {
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
        <p><strong>${process.env.APP_NAME} Support Team</strong></p>
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
      message: "OTP sent successfully. Please check your email.",
      success: true,
    });
  } else {
    return ApiError(400, "Invalid OTP type!");
  }
});
