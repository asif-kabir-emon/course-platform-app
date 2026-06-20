import { authGuard } from "@/utils/authGuard";
import { catchAsync } from "@/utils/handleApi";
import { ApiError } from "@/utils/apiError";
import { sendResponse } from "@/utils/sendResponse";
import { uploadProfileAvatar } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/utils/jwtToken";
import { getJwtSecret } from "@/utils/serverEnv";

export const runtime = "nodejs";
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 5 * 1024 * 1024;

export const POST = authGuard(catchAsync(async (request: Request) => {
  const user = request.user;
  if (!user?.id || !user.email || !user.role) return ApiError(401, "Unauthorized access!");

  const formData = await request.formData();
  const file = formData.get("avatar");
  if (!(file instanceof File)) return ApiError(400, "Choose an image to upload.");
  if (!allowedTypes.has(file.type)) return ApiError(400, "Use a JPG, PNG, or WebP image.");
  if (file.size > maxFileSize) return ApiError(400, "The cropped image must be smaller than 5 MB.");

  const uploaded = await uploadProfileAvatar(file, user.id);
  const updatedProfile = await prisma.userProfiles.update({
    where: { userId: user.id },
    data: { imageUrl: uploaded.secure_url },
  });
  const name = [updatedProfile.firstName, updatedProfile.lastName].filter(Boolean).join(" ");
  const accessToken = createToken(
    { id: user.id, email: user.email, role: user.role, verified: user.verified, name, imageUrl: uploaded.secure_url },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" },
  );
  if (!accessToken) return ApiError(500, "Could not refresh the account session.");

  return sendResponse({
    status: 200,
    success: true,
    message: "Profile photo updated.",
    data: { imageUrl: uploaded.secure_url, publicId: uploaded.public_id, accessToken },
  });
}));
