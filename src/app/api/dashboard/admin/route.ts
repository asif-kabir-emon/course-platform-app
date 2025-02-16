import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

export const GET = authGuard(
  catchAsync(async (request: Request) => {
    const user = request.user;

    // Check if user is authenticated or not
    if (
      !user ||
      !user.id ||
      !user.email ||
      !user.role ||
      user.role !== UserRole.admin
    ) {
      return ApiError(401, "Unauthorized access!");
    }

    const purchasesData = await prisma.purchaseHistories.groupBy({
      by: ["isRefunded"],
      _sum: {
        pricePaidInCent: true,
      },
      _count: {
        id: true,
      },
    });

    const refundedData = purchasesData.find(
      (data) => data?.isRefunded === true,
    );

    const salesData = purchasesData.find((data) => data?.isRefunded === false);

    // Total students count
    const totalStudents = await prisma.userCourseAccess
      .groupBy({
        by: ["userId"],
        _count: {
          id: true,
        },
      })
      .then((data) => data.length ?? 0);

    // Total courses count
    const totalCourses = await prisma.courses.count();

    // Total products count
    const totalProducts = await prisma.products.count();

    // Total sections count
    const totalSections = await prisma.courseSections.count();

    // Total lessons count
    const totalLessons = await prisma.courseLessons.count();

    const formattedData = {
      netSales: (salesData?._sum.pricePaidInCent ?? 0) / 100,
      refundedSales: (refundedData?._sum.pricePaidInCent ?? 0) / 100,
      totalUnRefundedPPurchases: refundedData?._count.id ?? 0,
      totalRefundedPurchases: refundedData?._count.id ?? 0,
      averageNetSales:
        (salesData?._sum.pricePaidInCent ?? 0) /
        (salesData?._count.id ?? 1) /
        100,
      totalStudents: totalStudents,
      totalCourses: totalCourses,
      totalProducts: totalProducts,
      totalSections: totalSections,
      totalLessons: totalLessons,
    };

    return sendResponse({
      status: 200,
      message: "Dashboard data fetched successfully!",
      success: true,
      data: formattedData,
    });
  }),
);
