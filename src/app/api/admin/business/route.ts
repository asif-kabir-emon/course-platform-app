import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminBusiness";
import { authGuard } from "@/utils/authGuard";
import { catchAsync } from "@/utils/handleApi";
import { sendResponse } from "@/utils/sendResponse";

const editableFields = [
  "legalName", "tradingName", "supportEmail", "taxId", "addressLine1",
  "addressLine2", "city", "state", "postalCode", "country", "currency",
  "automaticTaxEnabled", "invoicePrefix", "termsUrl", "privacyUrl",
  "refundUrl", "cookieUrl",
] as const;

export const GET = authGuard(catchAsync(async (request: Request) => {
  const user = requireAdmin(request);
  if (user instanceof Response) return user;

  const settings = await prisma.businessSettings.upsert({
    where: { key: "default" },
    update: {},
    create: {},
  });
  return sendResponse({ status: 200, success: true, message: "Business settings fetched.", data: settings });
}));

export const PATCH = authGuard(catchAsync(async (request: Request) => {
  const user = requireAdmin(request);
  if (user instanceof Response) return user;
  const body = await request.json();
  const data = Object.fromEntries(editableFields.filter((field) => field in body).map((field) => [field, body[field]]));
  const settings = await prisma.businessSettings.upsert({
    where: { key: "default" },
    update: data,
    create: data,
  });
  return sendResponse({ status: 200, success: true, message: "Business settings saved.", data: settings });
}));
