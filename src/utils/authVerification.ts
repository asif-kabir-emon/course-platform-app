import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { getJwtSecret } from "./serverEnv";

export const authVerification = async ({
  authorization,
}: {
  authorization: string;
}): Promise<{
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    verified: boolean;
    role: string;
  };
}> => {
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return {
      success: false,
      message: "Unauthorized: No token provided.",
    };
  }

  const token = authorization.split(" ")[1];
  const jwtSecret = getJwtSecret();

  // Verify the token
  const decoded = await jwtVerify(token, new TextEncoder().encode(jwtSecret));

  if (!decoded) {
    return {
      success: false,
      message: "Unauthorized: Invalid or expired token.",
    };
  }

  const payload = decoded.payload as jwtPayload;

  // Check if the user exists in the database
  const user = await prisma.users.findUnique({
    where: { id: payload.id, email: payload.email },
  });

  if (!user) {
    return {
      success: false,
      message: "Unauthorized: User not found.",
    };
  }

  return {
    success: true,
    message: "Authorized",
    user: {
      id: user.id,
      email: user.email,
      verified: user.isVerified,
      role: user.role,
    },
  };
};
