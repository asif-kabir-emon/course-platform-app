import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";
import { PrismaClient } from "@prisma/client";
import { createToken } from "@/utils/jwtToken";

const prisma = new PrismaClient();

export const GET = authGuard(
  catchAsync(async (request: Request) => {
    const user = request.user;
    const revalidateToken = new URLSearchParams(request.url.split("?")[1]).get(
      "revalidateToken",
    );

    // Check if user is authenticated or not
    if (!user || !user.id || !user.email || !user.role) {
      return ApiError(401, "Unauthorized access!");
    }

    const userProfile = await prisma.users.findUnique({
      where: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      include: {
        profile: true,
      },
    });

    if (!userProfile) {
      return ApiError(404, "User profile not found!");
    }

    const payload = {
      id: userProfile.id || user.id,
      email: userProfile.email || user.email,
      role: userProfile.role || user.role,
      verified: userProfile.isVerified || user.verified,
      name:
        `${userProfile.profile?.firstName} ${userProfile.profile?.lastName}`.trim() ||
        user.name,
      imageUrl: userProfile.profile?.imageUrl || user.imageUrl,
    };

    if (revalidateToken && revalidateToken === "true") {
      const jwtSecret = String(process.env.NEXT_PUBLIC_JWT_SECRET) || "";
      const jwtExpiresIn = String(process.env.JWT_EXPIRES_IN) || "1h";
      const token = createToken(payload, jwtSecret, {
        expiresIn: jwtExpiresIn,
      });

      if (!token) {
        return ApiError(500, "Internal Server Error!");
      }

      return sendResponse({
        status: 200,
        message: "User profile updated successfully!",
        success: true,
        data: {
          ...payload,
          accessToken: token,
        },
      });
    }

    return sendResponse({
      status: 200,
      message: "User profile updated successfully!",
      success: true,
      data: payload,
    });
  }),
);
