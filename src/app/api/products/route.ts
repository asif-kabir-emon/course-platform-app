import { Prisma, PrismaClient, ProductStatus } from "@prisma/client";
import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";
import { UserRole } from "@/constants/UserRole.constant";
import { authVerification } from "@/utils/authVerification";

const prisma = new PrismaClient();

export const POST = authGuard(
  catchAsync(async (request: Request) => {
    const user = request.user;
    const { name, description, imageUrl, priceInDollar, status, courseIds } =
      await request.json();

    // Check if user is authenticated or not
    if (user && user.role !== UserRole.admin) {
      return ApiError(401, "Unauthorized access!");
    }

    // Check if payload is valid or not
    if (
      !name ||
      !description ||
      typeof priceInDollar !== "number" ||
      priceInDollar < 0 ||
      !imageUrl ||
      !status ||
      ![ProductStatus.public, ProductStatus.private].includes(status) ||
      !Array.isArray(courseIds) ||
      courseIds.length <= 0
    ) {
      return ApiError(400, "Invalid payload!");
    }

    // Check if courseIds are valid or not
    const courses = await prisma.courses.findMany({
      where: {
        id: {
          in: courseIds,
        },
      },
    });

    if (!courses) {
      return ApiError(404, "No courses found!");
    }

    if (courses.length !== courseIds.length) {
      return ApiError(404, "Some courses are not valid!");
    }

    // Create a new product
    const newProduct = await prisma.$transaction(
      async (trc: Prisma.TransactionClient) => {
        const product = await trc.products.create({
          data: {
            name: name,
            description: description || "",
            imageUrl: imageUrl,
            priceInDollar: priceInDollar || 0,
            status: status || ProductStatus.private,
            courseIds: courseIds,
          },
        });

        if (!product) {
          return ApiError(500, "Failed to create!");
        }

        await trc.courseProducts.createMany({
          data: courseIds.map((courseId) => {
            return {
              courseId: courseId,
              productId: product.id,
            };
          }),
        });

        return product;
      },
    );

    if (!newProduct) {
      return ApiError(500, "Failed to create!");
    }

    return sendResponse({
      status: 200,
      message: "Added successfully!",
      success: true,
      data: newProduct,
    });
  }),
);

export const GET = catchAsync(async (request: Request) => {
  const showAllProducts = new URLSearchParams(request.url.split("?")[1]).get(
    "showAllProducts",
  );

  const authorization = await authVerification({
    authorization: request.headers.get("authorization") || "",
  });

  let products = [];

  if (authorization?.success && showAllProducts === "true") {
    products = await prisma.products.findMany({
      include: {
        PurchaseHistories: true,
      },
    });
  } else {
    products = await prisma.products.findMany({
      where: {
        status: ProductStatus.public,
      },
      include: {
        PurchaseHistories: true,
      },
    });
  }

  if (!products) {
    return ApiError(404, "No data found!");
  }

  const reformatedData =
    products.map((product) => {
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        priceInDollar: product.priceInDollar,
        status: product.status,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        coursesCount: product.courseIds.length || 0,
        customersCount: product.PurchaseHistories.length || 0,
      };
    }) || [];

  return sendResponse({
    status: 200,
    message: "Courses fetched successfully!",
    success: true,
    meta: {
      count: products.length,
    },
    data: reformatedData,
  });
});
