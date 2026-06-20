import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminBusiness";
import { authGuard } from "@/utils/authGuard";
import { catchAsync } from "@/utils/handleApi";
import { sendResponse } from "@/utils/sendResponse";

export const GET = authGuard(catchAsync(async (request: Request) => {
  const admin = requireAdmin(request);
  if (admin instanceof Response) return admin;
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 29);
  since.setUTCHours(0, 0, 0, 0);

  const [purchases, customerCount, convertedCustomers, accesses, completedCount] = await Promise.all([
    prisma.purchaseHistories.findMany({ where: { createdAt: { gte: since } }, select: { pricePaidInCent: true, isRefunded: true, createdAt: true } }),
    prisma.users.count({ where: { role: "user", isDeleted: false } }),
    prisma.purchaseHistories.groupBy({ by: ["userId"], where: { isRefunded: false } }).then((rows) => rows.length),
    prisma.userCourseAccess.findMany({
      where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      select: { courses: { select: { sections: { select: { lessons: { select: { id: true } } } } } } },
    }),
    prisma.userLessonComplete.count(),
  ]);

  const byDay = new Map<string, { date: string; revenueInCent: number; refundsInCent: number; sales: number }>();
  for (let offset = 0; offset < 30; offset++) {
    const day = new Date(since); day.setUTCDate(day.getUTCDate() + offset);
    const date = day.toISOString().slice(0, 10);
    byDay.set(date, { date, revenueInCent: 0, refundsInCent: 0, sales: 0 });
  }
  purchases.forEach((purchase) => {
    const day = byDay.get(purchase.createdAt.toISOString().slice(0, 10));
    if (!day) return;
    if (purchase.isRefunded) day.refundsInCent += purchase.pricePaidInCent;
    else { day.revenueInCent += purchase.pricePaidInCent; day.sales += 1; }
  });
  const possibleCompletions = accesses.reduce((sum, access) => sum + access.courses.sections.reduce((sectionSum, section) => sectionSum + section.lessons.length, 0), 0);
  const revenueInCent = purchases.filter((item) => !item.isRefunded).reduce((sum, item) => sum + item.pricePaidInCent, 0);
  const refundsInCent = purchases.filter((item) => item.isRefunded).reduce((sum, item) => sum + item.pricePaidInCent, 0);
  return sendResponse({ status: 200, success: true, message: "Analytics fetched.", data: {
    periodDays: 30, revenueInCent, refundsInCent,
    refundRate: purchases.length ? Math.round((purchases.filter((item) => item.isRefunded).length / purchases.length) * 1000) / 10 : 0,
    conversionRate: customerCount ? Math.round((convertedCustomers / customerCount) * 1000) / 10 : 0,
    courseCompletionRate: possibleCompletions ? Math.min(100, Math.round((completedCount / possibleCompletions) * 1000) / 10) : 0,
    trend: [...byDay.values()],
  } });
}));
