import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/apiError";
import { authGuard } from "@/utils/authGuard";
import { catchAsync } from "@/utils/handleApi";
import { sendResponse } from "@/utils/sendResponse";

export const GET = authGuard(
  catchAsync(async (request: Request, context: unknown) => {
    const user = request.user;
    const { course: courseId } = await (
      context as { params: Promise<{ course: string }> }
    ).params;

    if (!user || !courseId) {
      return ApiError(401, "Unauthorized access!");
    }

    const reviews = await prisma.courseReviews.findMany({
      where: { courseId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        rating: true,
        comment: true,
        userId: true,
        updatedAt: true,
        user: {
          select: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : 0;

    return sendResponse({
      status: 200,
      message: "Course reviews fetched successfully!",
      success: true,
      data: {
        averageRating,
        reviewCount: reviews.length,
        currentUserReview:
          reviews.find((review) => review.userId === user.id) ?? null,
        reviews: reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          updatedAt: review.updatedAt,
          author:
            [
              review.user.profile?.firstName,
              review.user.profile?.lastName,
            ]
              .filter(Boolean)
              .join(" ") || "Learner",
        })),
      },
    });
  }),
);

export const PUT = authGuard(
  catchAsync(async (request: Request, context: unknown) => {
    const user = request.user;
    const { course: courseId } = await (
      context as { params: Promise<{ course: string }> }
    ).params;
    const { rating, comment } = await request.json();

    if (
      !user ||
      !courseId ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      (comment !== undefined && typeof comment !== "string")
    ) {
      return ApiError(400, "Invalid review.");
    }

    const access = await prisma.userCourseAccess.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
    });

    if (!access) {
      return ApiError(403, "Only enrolled learners can review this course.");
    }

    const review = await prisma.courseReviews.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
      update: {
        rating,
        comment: comment?.trim().slice(0, 2000) || null,
      },
      create: {
        userId: user.id,
        courseId,
        rating,
        comment: comment?.trim().slice(0, 2000) || null,
      },
    });

    return sendResponse({
      status: 200,
      message: "Course review saved!",
      success: true,
      data: review,
    });
  }),
);
