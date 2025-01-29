import { ApiError } from "@/utils/apiError";

export const catchAsync = (
  fn: (request: Request, context: unknown) => Promise<Response>,
) => {
  return async (request: Request, context: unknown) => {
    try {
      return await fn(request, context);
    } catch (error) {
      console.error("Error in catchAsync:", error);
      const err = error as { status?: number; message?: string };

      // Return an appropriate error response
      return ApiError(
        err.status || 500,
        err.message || "Internal Server Error!",
      );
    }
  };
};
