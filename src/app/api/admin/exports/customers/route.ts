import { authGuard } from "@/utils/authGuard";
import { catchAsync } from "@/utils/handleApi";
import { prisma } from "@/lib/prisma";
import { csvResponse, requireAdmin } from "@/lib/adminBusiness";

export const GET = authGuard(catchAsync(async (request: Request) => {
  const admin = requireAdmin(request);
  if (admin instanceof Response) return admin;
  const customers = await prisma.users.findMany({ where: { role: "user" }, orderBy: { createdAt: "desc" }, include: { profile: true, userCourseAccess: true, purchaseHistories: true } });
  return csvResponse(`customers-${new Date().toISOString().slice(0, 10)}.csv`, [
    ["Customer ID", "First name", "Last name", "Email", "Verified", "Courses", "Purchases", "Lifetime value", "Joined", "Deleted"],
    ...customers.map((customer) => [customer.id, customer.profile?.firstName, customer.profile?.lastName, customer.email, customer.isVerified, customer.userCourseAccess.length, customer.purchaseHistories.length, customer.purchaseHistories.filter((sale) => !sale.isRefunded).reduce((sum, sale) => sum + sale.pricePaidInCent, 0) / 100, customer.createdAt.toISOString(), customer.isDeleted]),
  ]);
}));
