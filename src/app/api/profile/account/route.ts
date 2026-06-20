import { authGuard } from "@/utils/authGuard";
import { catchAsync } from "@/utils/handleApi";
import { ApiError } from "@/utils/apiError";
import { sendResponse } from "@/utils/sendResponse";
import { prisma } from "@/lib/prisma";

export const DELETE = authGuard(catchAsync(async (request: Request) => {
  if (!request.user?.id) return ApiError(401, "Unauthorized access!");
  if (request.user.role !== "user") return ApiError(403, "Administrator accounts cannot be self-deleted.");
  const userId = request.user.id;
  await prisma.$transaction(async (transaction) => {
    await Promise.all([
      transaction.userCourseAccess.deleteMany({ where: { userId } }),
      transaction.oTPVerifications.deleteMany({ where: { userId } }),
      transaction.userLessonComplete.deleteMany({ where: { userId } }),
      transaction.userLessonProgress.deleteMany({ where: { userId } }),
      transaction.lessonNotes.deleteMany({ where: { userId } }),
      transaction.lessonBookmarks.deleteMany({ where: { userId } }),
      transaction.courseReviews.deleteMany({ where: { userId } }),
      transaction.quizAttempts.deleteMany({ where: { userId } }),
    ]);
    await transaction.users.update({ where: { id: userId }, data: { isDeleted: true, deletedAt: new Date(), email: `deleted+${userId}@invalid.local`, password: "ACCOUNT_DELETED" } });
    await transaction.userProfiles.updateMany({ where: { userId }, data: { firstName: null, lastName: null, phone: null, dateOfBirth: null, imageUrl: null, email: `deleted+${userId}@invalid.local` } });
  });
  return sendResponse({ status: 200, success: true, message: "Your account has been deleted and personal data anonymized." });
}));
