import { ApiError } from "@/utils/apiError";

export const catchAsync = (
  fn: (request: Request, context: unknown) => Promise<Response>,
) => {
  return async (request: Request, context: unknown) => {
    try {
      return await fn(request, context);
    } catch (error) {
      const err = error as { status?: number; message?: string };

      return ApiError(
        err.status || 500,
        err.message || "Internal Server Error!",
      );
    }
  };
};
