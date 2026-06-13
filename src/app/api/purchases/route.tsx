import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";
import { isAdminRole } from "@/constants/UserRole.constant";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  caseInsensitiveMongoFilter,
  extractMongoIds,
} from "@/lib/mongoSearch";


export const GET = authGuard(
  catchAsync(async (request: Request) => {
    const user = request.user;

    // Check if user is authenticated or not
    if (
      !user ||
      !user.id ||
      !user.email ||
      !user.role ||
      !isAdminRole(user.role)
    ) {
      return ApiError(401, "Unauthorized access!");
    }

    // Check if user exists with
    const isUserExist = await prisma.users.findFirst({
      where: {
        id: user.id,
        email: user.email,
      },
    });

    if (!isUserExist) {
      return ApiError(404, "User not found!");
    }

    const searchParams = new URL(request.url).searchParams;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize")) || 10),
    );
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status");
    const [matchingUserIds, matchingPurchaseIds] = search
      ? await Promise.all([
          prisma.users
            .findRaw({
              filter: caseInsensitiveMongoFilter("email", search),
              options: { projection: { _id: 1 } },
            })
            .then(extractMongoIds),
          prisma.purchaseHistories
            .findRaw({
              filter: caseInsensitiveMongoFilter(
                "productDetails.name",
                search,
              ),
              options: { projection: { _id: 1 } },
            })
            .then(extractMongoIds),
        ])
      : [undefined, undefined];
    const where: Prisma.PurchaseHistoriesWhereInput = {
      ...(search
        ? {
            OR: [
              { userId: { in: matchingUserIds } },
              { id: { in: matchingPurchaseIds } },
            ],
          }
        : {}),
      ...(status === "paid"
        ? { isRefunded: false }
        : status === "refunded"
          ? { isRefunded: true }
          : {}),
    };
    const [purchaseHistories, total] = await Promise.all([
      prisma.purchaseHistories.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            include: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      prisma.purchaseHistories.count({ where }),
    ]);

    return sendResponse({
      status: 200,
      message: "Purchase histories fetched successfully!",
      success: true,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      data: purchaseHistories,
    });
  }),
);
