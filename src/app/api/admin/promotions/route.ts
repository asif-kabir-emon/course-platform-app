import { DiscountType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminBusiness";
import { authGuard } from "@/utils/authGuard";
import { catchAsync } from "@/utils/handleApi";
import { ApiError } from "@/utils/apiError";
import { sendResponse } from "@/utils/sendResponse";
import { syncPromotionStatuses } from "@/lib/promotions";

export const GET = authGuard(catchAsync(async (request: Request) => {
  const user = requireAdmin(request);
  if (user instanceof Response) return user;
  await syncPromotionStatuses();
  const data = await prisma.promotions.findMany({ orderBy: { createdAt: "desc" } });
  return sendResponse({ status: 200, success: true, message: "Promotions fetched.", data });
}));

export const POST = authGuard(catchAsync(async (request: Request) => {
  const user = requireAdmin(request);
  if (user instanceof Response) return user;
  const body = await request.json();
  const code = String(body.code || "").trim().toUpperCase();
  const name = String(body.name || "").trim();
  const discountType = body.discountType as DiscountType;
  const discountValue = Number(body.discountValue);
  const maxRedemptions = body.maxRedemptions ? Number(body.maxRedemptions) : null;
  const maxRedemptionsPerCustomer = body.maxRedemptionsPerCustomer
    ? Number(body.maxRedemptionsPerCustomer)
    : null;
  const maximumRedeemAmountInCent = body.maximumRedeemAmountInCent
    ? Number(body.maximumRedeemAmountInCent)
    : null;
  if (!code || !name || !["percent", "fixed"].includes(discountType) || discountValue <= 0 || (discountType === "percent" && discountValue > 100)) {
    return ApiError(400, "Invalid promotion details.");
  }
  if (
    (maxRedemptions != null && maxRedemptions < 1) ||
    (maxRedemptionsPerCustomer != null && maxRedemptionsPerCustomer < 1) ||
    (maximumRedeemAmountInCent != null && maximumRedeemAmountInCent < 1) ||
    (maxRedemptions != null &&
      maxRedemptionsPerCustomer != null &&
      maxRedemptionsPerCustomer > maxRedemptions)
  ) {
    return ApiError(400, "Invalid redemption limits.");
  }

  const startsAt = body.startsAt ? new Date(body.startsAt) : null;
  const endsAt = body.endsAt ? new Date(body.endsAt) : null;
  if (startsAt && endsAt && startsAt >= endsAt) {
    return ApiError(400, "The promotion end must be after its start.");
  }
  const data = await prisma.promotions.create({
    data: {
      code, name, discountType, discountValue,
      startsAt,
      endsAt,
      maxRedemptions,
      maxRedemptionsPerCustomer,
      maximumRedeemAmountInCent,
      minimumAmountInCent: body.minimumAmountInCent ? Number(body.minimumAmountInCent) : null,
      firstTimeCustomersOnly: Boolean(body.firstTimeCustomersOnly),
      status: "draft",
      isActive: false,
    },
  });
  return sendResponse({ status: 201, success: true, message: "Promotion saved as a draft.", data });
}));
