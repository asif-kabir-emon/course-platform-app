import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const GET = authGuard(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catchAsync(async (request: Request, context: any) => {
    const params = await context.params;
    const user = request.user;
    const productId = params.product;

    // Check if user is authenticated or not
    if (!user || user.id) {
      return ApiError(401, "Unauthorized access!");
    }

    // Check if product exists
    if (!productId) {
      return ApiError(404, "Product not found!");
    }

    // check if user has access to the product
    const hasAccess = await prisma.purchaseHistories.findFirst({
      where: {
        userId: user.id,
        productId: productId,
        refundAt: null,
      },
    });

    return sendResponse({
      status: 200,
      message: "User access checked successfully!",
      success: true,
      data: {
        hasAccess: !!hasAccess,
      },
    });
  }),
);
