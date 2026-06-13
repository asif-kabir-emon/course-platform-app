import { CourseLessonStatus } from "@/constants/CourseLessonStatus.constant";
import { CourseSectionStatus } from "@/constants/CourseSectionStatus.constant";
import { ProductStatus } from "@/constants/ProductStatus.constant";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";
import {
  isAdminRole,
  isSuperAdminRole,
} from "@/constants/UserRole.constant";
import { authVerification } from "@/utils/authVerification";


export const PUT = authGuard(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catchAsync(async (request: Request, context: any) => {
    const params = await context.params;
    const user = request.user;
    const productId = params.product;
    const { name, description, imageUrl, priceInDollar, status, courseIds } =
      await request.json();

    // Check if user is authenticated or not
    if (user && !isAdminRole(user.role)) {
      return ApiError(401, "Unauthorized access!");
    }

    console.log({
      name,
      description,
      imageUrl,
      priceInDollar,
      status,
      courseIds,
    });

    // Check if payload is valid or not
    if (
      !name ||
      !description ||
      !imageUrl ||
      typeof priceInDollar !== "number" ||
      priceInDollar < 0 ||
      !status ||
      ![ProductStatus.public, ProductStatus.private].includes(status) ||
      !Array.isArray(courseIds) ||
      courseIds.length <= 0
    ) {
      return ApiError(400, "Invalid payload!");
    }

    // Check if product exists
    const isProductExist = await prisma.products.findUnique({
      where: {
        id: productId,
      },
    });

    if (!isProductExist) {
      return ApiError(404, "Not found!");
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

    // find out new courseIds
    const newCourseIds = courseIds.filter(
      (courseId) => !isProductExist.courseIds.includes(courseId),
    );

    // find out deleted courseIds
    const deletedCourseIds = isProductExist.courseIds.filter(
      (courseId) => !courseIds.includes(courseId),
    );

    // Update the product
    const updatedProduct = await prisma.$transaction(
      async (trc: Prisma.TransactionClient) => {
        // Update the product
        const updatedProduct = await trc.products.update({
          where: {
            id: productId,
          },
          data: {
            name: name,
            description: description || "",
            imageUrl: imageUrl,
            priceInDollar: priceInDollar || 0,
            status: status || ProductStatus.private,
            courseIds: courseIds,
          },
        });

        if (!updatedProduct) {
          return ApiError(500, "Failed to update!");
        }

        if (newCourseIds.length > 0) {
          // Create new courseProducts where courseIds are not included before update
          await trc.courseProducts.createMany({
            data: newCourseIds.map((courseId) => {
              return {
                courseId: courseId,
                productId: productId,
              };
            }),
          });
        }

        if (deletedCourseIds.length > 0) {
          // Delete courseProducts where courseIds are not included after update
          await trc.courseProducts.deleteMany({
            where: {
              productId: productId,
              courseId: {
                in: deletedCourseIds,
              },
            },
          });
        }

        return updatedProduct;
      },
    );

    if (!updatedProduct) {
      return ApiError(500, "Failed to update!");
    }

    return sendResponse({
      status: 200,
      message: "Updated successfully!",
      success: true,
      data: updatedProduct,
    });
  }),
);

export const DELETE = authGuard(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catchAsync(async (request: Request, context: any) => {
    const params = await context.params;
    const user = request.user;
    const productId = params.product;

    // Check if user is authenticated or not
    if (user && !isAdminRole(user.role)) {
      return ApiError(401, "Unauthorized access!");
    }

    // Check if course exists
    const isProductExist = await prisma.products.findUnique({
      where: {
        id: productId,
      },
    });

    if (!isProductExist) {
      return ApiError(404, "Not found!");
    }

    // Delete the product
    const deletedProduct = await prisma.$transaction(
      async (trc: Prisma.TransactionClient) => {
        await trc.courseProducts.deleteMany({
          where: {
            productId: productId,
          },
        });

        const deletedProduct = await trc.products.delete({
          where: {
            id: productId,
          },
        });

        if (!deletedProduct) {
          return ApiError(500, "Failed to delete!");
        }

        return deletedProduct;
      },
    );

    return sendResponse({
      status: 200,
      message: "Deleted successfully!",
      success: true,
      data: deletedProduct,
    });
  }),
);

export const PATCH = authGuard(
  catchAsync(async (request: Request, context: unknown) => {
    const params = await (
      context as { params: Promise<{ product: string }> }
    ).params;
    const user = request.user;
    const productId = params.product;
    const { action } = await request.json();

    if (!user || !isAdminRole(user.role)) {
      return ApiError(403, "Admin access is required.");
    }

    if (
      (action === "archive" || action === "restore") &&
      !isSuperAdminRole(user.role)
    ) {
      return ApiError(403, "Only a super admin can archive products.");
    }

    const product = await prisma.products.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return ApiError(404, "Product not found.");
    }

    const changes = {
      publish: { status: ProductStatus.public, isDeleted: false },
      unpublish: { status: ProductStatus.private },
      archive: { status: ProductStatus.private, isDeleted: true },
      restore: { isDeleted: false },
    }[action as "publish" | "unpublish" | "archive" | "restore"];

    if (!changes) {
      return ApiError(400, "Unsupported product action.");
    }

    const updatedProduct = await prisma.products.update({
      where: { id: productId },
      data: changes,
    });

    return sendResponse({
      status: 200,
      message:
        {
          publish: "Product published successfully.",
          unpublish: "Product moved to private successfully.",
          archive: "Product archived successfully.",
          restore: "Product restored successfully.",
        }[action as "publish" | "unpublish" | "archive" | "restore"] ||
        "Product updated successfully.",
      success: true,
      data: updatedProduct,
    });
  }),
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GET = catchAsync(async (request: Request, context: any) => {
  const params = await context.params;
  const productId = params.product;
  const authorization = await authVerification({
    authorization: request.headers.get("authorization") || "",
  });
  const isAdminRequest =
    authorization.success && isAdminRole(authorization.user?.role);

  // find product by id
  const product = await prisma.products.findUnique({
    where: {
      id: productId,
    },
    include: {
      courseProducts: {
        include: {
          course: {
            include: {
              sections: {
                ...(isAdminRequest
                  ? {}
                  : { where: { status: CourseSectionStatus.public } }),
                orderBy: {
                  order: "asc",
                },
                include: {
                  lessons: {
                    ...(isAdminRequest
                      ? {}
                      : {
                          where: {
                            status: {
                              in: [
                                CourseLessonStatus.public,
                                CourseLessonStatus.preview,
                              ],
                            },
                          },
                        }),
                    orderBy: {
                      order: "asc",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!product) {
    return ApiError(404, "Not found!");
  }

  if (product.isDeleted) {
    if (!isAdminRequest) {
      return ApiError(404, "Not found!");
    }
  }

  return sendResponse({
    status: 200,
    message: "Product fetched successfully!",
    success: true,
    data: product,
  });
});
