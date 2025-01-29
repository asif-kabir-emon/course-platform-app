import { PrismaClient } from "@prisma/client";
import { ApiError } from "./apiError";
import { jwtVerify } from "jose";

const prisma = new PrismaClient();

type RequestHandler = (request: Request, context: unknown) => Promise<Response>;

export const authGuard = (handler: RequestHandler) => {
  return async (request: Request, context: unknown) => {
    try {
      // Extract the token from the Authorization header
      const authorization = request.headers.get("authorization");
      if (!authorization || !authorization.startsWith("Bearer ")) {
        return ApiError(401, "Unauthorized: No token provided.");
      }

      const token = authorization.split(" ")[1];
      const jwtSecret = String(process.env.JWT_SECRET);

      // Verify the token
      const decoded = await jwtVerify(
        token,
        new TextEncoder().encode(jwtSecret),
      );

      if (!decoded) {
        return ApiError(401, "Unauthorized: Invalid or expired token.");
      }

      const payload = decoded.payload as jwtPayload;

      // Check if the user exists in the database
      const user = await prisma.users.findUnique({
        where: { id: payload.id, email: payload.email },
      });

      if (!user) {
        return ApiError(404, "Unauthorized: User not found in the database.");
      }

      // Attach the user to the request object for further use
      request.user = {
        id: user.id,
        email: user.email,
      };

      // Proceed to the original handler
      return handler(request, context);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return ApiError(401, "Unauthorized: Invalid or expired token.");
    }
  };
};
