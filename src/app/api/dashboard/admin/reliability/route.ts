import { isAdminRole } from "@/constants/UserRole.constant";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/apiError";
import { authGuard } from "@/utils/authGuard";
import { catchAsync } from "@/utils/handleApi";
import { sendResponse } from "@/utils/sendResponse";

export const GET = authGuard(
  catchAsync(async (request: Request) => {
    const user = request.user;

    if (!user || !isAdminRole(user.role)) {
      return ApiError(401, "Unauthorized access!");
    }

    const staleBefore = new Date(Date.now() - 10 * 60 * 1000);
    const [failedEvents, processingEvents, recentEvents] = await Promise.all([
      prisma.stripeWebhookEvents.count({ where: { status: "failed" } }),
      prisma.stripeWebhookEvents.count({
        where: {
          status: "processing",
          updatedAt: { lt: staleBefore },
        },
      }),
      prisma.stripeWebhookEvents.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return sendResponse({
      status: 200,
      message: "Payment reliability data fetched successfully!",
      success: true,
      data: {
        failedEvents,
        staleProcessingEvents: processingEvents,
        recentEvents,
      },
    });
  }),
);
