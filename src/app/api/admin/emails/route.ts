import { authGuard } from "@/utils/authGuard";
import { catchAsync } from "@/utils/handleApi";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminBusiness";
import { sendResponse } from "@/utils/sendResponse";

export const GET = authGuard(catchAsync(async (request: Request) => {
  const admin = requireAdmin(request);
  if (admin instanceof Response) return admin;
  const data = await prisma.emailDeliveries.findMany({ take: 100, orderBy: { createdAt: "desc" } });
  return sendResponse({ status: 200, success: true, message: "Email deliveries fetched.", data });
}));
