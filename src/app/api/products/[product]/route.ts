import { Prisma, PrismaClient, ProductStatus } from "@prisma/client";
import { sendResponse } from "@/utils/sendResponse";
import { ApiError } from "@/utils/apiError";
import { catchAsync } from "@/utils/handleApi";
import { authGuard } from "@/utils/authGuard";
import { UserRole } from "@/constants/UserRole.constant";

const prisma = new PrismaClient();

export const PUT = authGuard(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catchAsync(async (request: Request, context: any) => {
    const params = await context.params;
    const user = request.user;
    const productId = params.product;
    const { name, description, imageUrl, priceInDollar, status, courseIds } =
      await request.json();

    // Check if user is authenticated or not
    if (user && user.role !== UserRole.admin) {
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
    if (user && user.role !== UserRole.admin) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GET = catchAsync(async (request: Request, context: any) => {
  const params = await context.params;
  const productId = params.product;

  // find product by id
  const product = await prisma.products.findUnique({
    where: {
      id: productId,
    },
  });

  if (!product) {
    return ApiError(404, "Not found!");
  }

  return sendResponse({
    status: 200,
    message: "Product fetched successfully!",
    success: true,
    data: product,
  });
});
