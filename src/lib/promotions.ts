import { prisma } from "@/lib/prisma";
import { stripeServerClient } from "@/helpers/stripe/stripeServer";

export async function syncPromotionStatuses() {
  if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_")) return;

  const now = new Date();
  const [scheduled, expired] = await Promise.all([
    prisma.promotions.findMany({
      where: {
        status: "scheduled",
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        stripePromotionCodeId: { not: null },
      },
    }),
    prisma.promotions.findMany({
      where: {
        status: { in: ["active", "scheduled", "paused"] },
        endsAt: { lte: now },
      },
    }),
  ]);

  await Promise.all([
    ...scheduled.map(async (promotion) => {
      await stripeServerClient.promotionCodes.update(
        promotion.stripePromotionCodeId!,
        { active: true },
      );
      await prisma.promotions.update({
        where: { id: promotion.id },
        data: { status: "active", isActive: true },
      });
    }),
    ...expired.map(async (promotion) => {
      if (promotion.stripePromotionCodeId && promotion.status !== "expired") {
        await stripeServerClient.promotionCodes
          .update(promotion.stripePromotionCodeId, { active: false })
          .catch(() => undefined);
      }
      await prisma.promotions.update({
        where: { id: promotion.id },
        data: { status: "expired", isActive: false },
      });
    }),
  ]);
}
