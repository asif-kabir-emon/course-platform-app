import { ProductStatus } from "@/constants/ProductStatus.constant";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";
import { isAdminRole } from "@/constants/UserRole.constant";
import { authVerification } from "@/utils/authVerification";
import {
  caseInsensitiveMongoFilter,
  extractMongoIds,
} from "@/lib/mongoSearch";


export const POST = authGuard(
  catchAsync(async (request: Request) => {
    const user = request.user;
    const { name, description, imageUrl, priceInDollar, status, courseIds } =
      await request.json();

    // Check if user is authenticated or not
    if (user && !isAdminRole(user.role)) {
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
  const searchParams = new URL(request.url).searchParams;
  const showAllProducts = searchParams.get("showAllProducts");
  const paginate = searchParams.get("paginate") === "true";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize")) || 10),
  );
  const search = searchParams.get("search")?.trim() || "";
  const status = searchParams.get("status");
  const visibility = searchParams.get("visibility");

  const authorization = await authVerification({
    authorization: request.headers.get("authorization") || "",
  });

  const isAdminRequest =
    authorization?.success &&
    isAdminRole(authorization.user?.role) &&
    showAllProducts === "true";
  const matchingProductIds = search
    ? extractMongoIds(
        await prisma.products.findRaw({
          filter: caseInsensitiveMongoFilter("name", search),
          options: { projection: { _id: 1 } },
        }),
      )
    : undefined;
  const where: Prisma.ProductsWhereInput = isAdminRequest
    ? {
        ...(matchingProductIds ? { id: { in: matchingProductIds } } : {}),
        ...(status === ProductStatus.public ||
        status === ProductStatus.private
          ? { status }
          : {}),
        ...(visibility === "active"
          ? { isDeleted: false }
          : visibility === "archived"
            ? { isDeleted: true }
            : {}),
      }
    : {
        status: ProductStatus.public,
        isDeleted: false,
        ...(matchingProductIds ? { id: { in: matchingProductIds } } : {}),
      };
  const [products, total] = await Promise.all([
    prisma.products.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...(paginate ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      include: {
        PurchaseHistories: true,
      },
    }),
    prisma.products.count({ where }),
  ]);

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
        isDeleted: product.isDeleted,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        coursesCount: product.courseIds.length || 0,
        customersCount: product.PurchaseHistories.length || 0,
      };
    }) || [];

  return sendResponse({
    status: 200,
    message: "Products fetched successfully!",
    success: true,
    meta: {
      count: products.length,
      total,
      page: paginate ? page : 1,
      pageSize: paginate ? pageSize : total || pageSize,
      totalPages: paginate ? Math.max(1, Math.ceil(total / pageSize)) : 1,
    },
    data: reformatedData,
  });
});
