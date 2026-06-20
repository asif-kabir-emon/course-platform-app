import { authGuard } from "@/utils/authGuard";
import { catchAsync } from "@/utils/handleApi";
import { ApiError } from "@/utils/apiError";
import { prisma } from "@/lib/prisma";

export const GET = authGuard(catchAsync(async (request: Request) => {
  if (!request.user?.id) return ApiError(401, "Unauthorized access!");
  const data = await prisma.users.findUnique({
    where: { id: request.user.id },
    select: {
      id: true, email: true, role: true, isVerified: true, createdAt: true, updatedAt: true,
      profile: true, userCourseAccess: { include: { courses: { select: { id: true, name: true } } } },
      purchaseHistories: true, userLessonComplete: true, userLessonProgress: true,
      lessonNotes: true, lessonBookmarks: true, courseReviews: true, quizAttempts: true,
    },
  });
  if (!data) return ApiError(404, "User not found!");
  return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="account-data-${data.id}.json"`, "Cache-Control": "no-store" } });
}));
