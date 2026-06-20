import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminBusiness";
import { authGuard } from "@/utils/authGuard";
import { catchAsync } from "@/utils/handleApi";
import { ApiError } from "@/utils/apiError";
import { sendResponse } from "@/utils/sendResponse";

export const GET = authGuard(catchAsync(async (request: Request) => {
  const admin = requireAdmin(request);
  if (admin instanceof Response) return admin;
  const params = new URL(request.url).searchParams;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize")) || 20));
  const where = { role: "user" as const, isDeleted: false };
  const [data, total] = await Promise.all([
    prisma.users.findMany({
      where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: "desc" },
      select: {
        id: true, email: true, isVerified: true, createdAt: true, profile: true,
        userCourseAccess: { include: { courses: { select: { id: true, name: true } } } },
        _count: { select: { purchaseHistories: true } },
      },
    }),
    prisma.users.count({ where }),
  ]);
  return sendResponse({ status: 200, success: true, message: "Customers fetched.", data, meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } });
}));

export const POST = authGuard(catchAsync(async (request: Request) => {
  const admin = requireAdmin(request);
  if (admin instanceof Response) return admin;
  const { userId, courseId, note, expiresAt } = await request.json();
  if (!userId || !courseId) return ApiError(400, "Customer and course are required.");
  const existingAccess = await prisma.userCourseAccess.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (existingAccess?.source === "purchase") {
    return ApiError(
      400,
      "This customer already has access through a purchase. Manual access was not changed.",
    );
  }

  const data = existingAccess
    ? await prisma.userCourseAccess.update({
        where: { userId_courseId: { userId, courseId } },
        data: {
          note: note || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      })
    : await prisma.userCourseAccess.create({
        data: {
          userId,
          courseId,
          source: "manual",
          note: note || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });

  return sendResponse({
    status: 200,
    success: true,
    message: existingAccess
      ? "Manual course access updated."
      : "Course access granted.",
    data,
  });
}));

export const DELETE = authGuard(catchAsync(async (request: Request) => {
  const admin = requireAdmin(request);
  if (admin instanceof Response) return admin;
  const { userId, courseId } = await request.json();
  if (!userId || !courseId) return ApiError(400, "Customer and course are required.");
  await prisma.userCourseAccess.deleteMany({ where: { userId, courseId, source: "manual" } });
  return sendResponse({ status: 200, success: true, message: "Manual course access revoked." });
}));
