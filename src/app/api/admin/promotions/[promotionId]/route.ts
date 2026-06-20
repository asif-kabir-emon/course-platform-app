import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminBusiness";
import { authGuard } from "@/utils/authGuard";
import { catchAsync } from "@/utils/handleApi";
import { ApiError } from "@/utils/apiError";
import { sendResponse } from "@/utils/sendResponse";
import { assertStripeSecretKey, stripeServerClient } from "@/helpers/stripe/stripeServer";

export const PATCH = authGuard(catchAsync(async (request: Request, context: unknown) => {
  const admin = requireAdmin(request);
  if (admin instanceof Response) return admin;
  const { promotionId } = await (context as { params: Promise<{ promotionId: string }> }).params;
  const payload = await request.json();
  const { action } = payload;
  const promotion = await prisma.promotions.findUnique({ where: { id: promotionId } });
  if (!promotion) return ApiError(404, "Promotion not found.");

  if (action === "update") {
    if ((promotion.status ?? "draft") !== "draft") return ApiError(400, "Only draft promotions can be edited.");
    const details = payload.details ?? {};
    const startsAt = details.startsAt ? new Date(details.startsAt) : null;
    const endsAt = details.endsAt ? new Date(details.endsAt) : null;
    const maxRedemptions = details.maxRedemptions
      ? Number(details.maxRedemptions)
      : null;
    const maxRedemptionsPerCustomer = details.maxRedemptionsPerCustomer
      ? Number(details.maxRedemptionsPerCustomer)
      : null;
    const maximumRedeemAmountInCent = details.maximumRedeemAmountInCent
      ? Number(details.maximumRedeemAmountInCent)
      : null;
    if (startsAt && endsAt && startsAt >= endsAt) return ApiError(400, "The promotion end must be after its start.");
    if (
      (maxRedemptions != null && maxRedemptions < 1) ||
      (maxRedemptionsPerCustomer != null && maxRedemptionsPerCustomer < 1) ||
      (maximumRedeemAmountInCent != null && maximumRedeemAmountInCent < 1) ||
      (maxRedemptions != null &&
        maxRedemptionsPerCustomer != null &&
        maxRedemptionsPerCustomer > maxRedemptions)
    ) return ApiError(400, "Invalid redemption limits.");
    const data = await prisma.promotions.update({ where: { id: promotion.id }, data: {
      code: String(details.code || promotion.code).trim().toUpperCase(),
      name: String(details.name || promotion.name).trim(),
      discountType: details.discountType ?? promotion.discountType,
      discountValue: Number(details.discountValue ?? promotion.discountValue),
      startsAt, endsAt,
      maxRedemptions,
      maxRedemptionsPerCustomer,
      maximumRedeemAmountInCent,
      minimumAmountInCent: details.minimumAmountInCent ? Number(details.minimumAmountInCent) : null,
      firstTimeCustomersOnly: Boolean(details.firstTimeCustomersOnly),
    } });
    return sendResponse({ status: 200, success: true, message: "Draft updated.", data });
  }

  if (action === "revert_to_draft") {
    if (
      !["scheduled", "paused"].includes(promotion.status ?? "") ||
      !promotion.startsAt ||
      promotion.startsAt <= new Date()
    ) {
      return ApiError(400, "Only promotions that have not started can be edited.");
    }
    assertStripeSecretKey();
    if (promotion.stripePromotionCodeId) {
      await stripeServerClient.promotionCodes.update(
        promotion.stripePromotionCodeId,
        { active: false },
      );
    }
    if (promotion.stripeCouponId) {
      await stripeServerClient.coupons
        .del(promotion.stripeCouponId)
        .catch(() => undefined);
    }
    const data = await prisma.promotions.update({
      where: { id: promotion.id },
      data: {
        status: "draft",
        isActive: false,
        stripeCouponId: null,
        stripePromotionCodeId: null,
        publishedAt: null,
      },
    });
    return sendResponse({
      status: 200,
      success: true,
      message: "Schedule cancelled. The promotion is editable again.",
      data,
    });
  }

  assertStripeSecretKey();
  if (action === "publish") {
    if (promotion.endsAt && promotion.endsAt <= new Date()) return ApiError(400, "Choose a future end date before publishing.");
    let couponId = promotion.stripeCouponId;
    let promotionCodeId = promotion.stripePromotionCodeId;
    const shouldActivate = !promotion.startsAt || promotion.startsAt <= new Date();
    if (!couponId) {
      const coupon = await stripeServerClient.coupons.create({
        name: promotion.name,
        duration: "once",
        ...(promotion.discountType === "percent" ? { percent_off: promotion.discountValue } : { amount_off: promotion.discountValue, currency: "usd" }),
      });
      couponId = coupon.id;
    }
    if (!promotionCodeId) {
      const stripeCode = await stripeServerClient.promotionCodes.create({
        coupon: couponId,
        code: promotion.code,
        active: shouldActivate,
        ...(promotion.endsAt ? { expires_at: Math.floor(promotion.endsAt.getTime() / 1000) } : {}),
        ...(promotion.maxRedemptions ? { max_redemptions: promotion.maxRedemptions } : {}),
        ...(promotion.firstTimeCustomersOnly || promotion.minimumAmountInCent ? {
          restrictions: {
            ...(promotion.firstTimeCustomersOnly ? { first_time_transaction: true } : {}),
            ...(promotion.minimumAmountInCent ? { minimum_amount: promotion.minimumAmountInCent, minimum_amount_currency: "usd" } : {}),
          },
        } : {}),
      });
      promotionCodeId = stripeCode.id;
    } else {
      await stripeServerClient.promotionCodes.update(promotionCodeId, { active: shouldActivate });
    }
    const data = await prisma.promotions.update({ where: { id: promotion.id }, data: { stripeCouponId: couponId, stripePromotionCodeId: promotionCodeId, status: shouldActivate ? "active" : "scheduled", isActive: shouldActivate, publishedAt: promotion.publishedAt ?? new Date() } });
    return sendResponse({ status: 200, success: true, message: shouldActivate ? "Promotion published." : "Promotion scheduled.", data });
  }

  if (action === "pause" || action === "resume") {
    if (!promotion.stripePromotionCodeId) return ApiError(400, "Publish this promotion first.");
    const active = action === "resume" && (!promotion.startsAt || promotion.startsAt <= new Date());
    await stripeServerClient.promotionCodes.update(promotion.stripePromotionCodeId, { active });
    const nextStatus = action === "pause" ? "paused" : active ? "active" : "scheduled";
    const data = await prisma.promotions.update({ where: { id: promotion.id }, data: { isActive: active, status: nextStatus } });
    return sendResponse({ status: 200, success: true, message: action === "pause" ? "Promotion paused." : active ? "Promotion resumed." : "Promotion rescheduled.", data });
  }
  return ApiError(400, "Unsupported promotion action.");
}));

export const DELETE = authGuard(catchAsync(async (request: Request, context: unknown) => {
  const admin = requireAdmin(request);
  if (admin instanceof Response) return admin;
  const { promotionId } = await (context as { params: Promise<{ promotionId: string }> }).params;
  const promotion = await prisma.promotions.findUnique({ where: { id: promotionId } });
  if (!promotion) return ApiError(404, "Promotion not found.");
  const status = promotion.status ?? "draft";
  const isUnstartedSchedule =
    ["scheduled", "paused"].includes(status) &&
    promotion.startsAt != null &&
    promotion.startsAt > new Date();
  if (status !== "draft" && !isUnstartedSchedule) {
    return ApiError(400, "Only drafts or promotions that have not started can be deleted.");
  }
  if (isUnstartedSchedule) {
    assertStripeSecretKey();
    if (promotion.stripePromotionCodeId) {
      await stripeServerClient.promotionCodes.update(
        promotion.stripePromotionCodeId,
        { active: false },
      );
    }
    if (promotion.stripeCouponId) {
      await stripeServerClient.coupons
        .del(promotion.stripeCouponId)
        .catch(() => undefined);
    }
  }
  await prisma.promotions.delete({ where: { id: promotionId } });
  return sendResponse({
    status: 200,
    success: true,
    message: isUnstartedSchedule ? "Scheduled promotion cancelled and deleted." : "Draft deleted.",
  });
}));
