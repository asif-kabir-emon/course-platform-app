import { authGuard } from "@/utils/authGuard";
import { catchAsync } from "@/utils/handleApi";
import { prisma } from "@/lib/prisma";
import { csvResponse, requireAdmin } from "@/lib/adminBusiness";

export const GET = authGuard(catchAsync(async (request: Request) => {
  const admin = requireAdmin(request);
  if (admin instanceof Response) return admin;
  const sales = await prisma.purchaseHistories.findMany({ orderBy: { createdAt: "desc" }, include: { user: { include: { profile: true } } } });
  return csvResponse(`sales-${new Date().toISOString().slice(0, 10)}.csv`, [
    ["Purchase ID", "Invoice", "Date", "Customer", "Email", "Product", "Subtotal", "Discount", "Tax", "Total", "Currency", "Status"],
    ...sales.map((sale) => [sale.id, sale.invoiceNumber, sale.createdAt.toISOString(), [sale.user.profile?.firstName, sale.user.profile?.lastName].filter(Boolean).join(" "), sale.user.email, sale.productDetails.name, (sale.subtotalInCent ?? sale.pricePaidInCent) / 100, sale.discountInCent / 100, sale.taxInCent / 100, sale.pricePaidInCent / 100, sale.currency.toUpperCase(), sale.isRefunded ? "Refunded" : "Paid"]),
  ]);
}));
