import { jwtVerify } from "jose";

export async function validateToken(
  token: string,
  secret: string,
): Promise<boolean> {
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch (error) {
    console.error("JWT validation failed:", error);
    return false;
  }
}
