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

export async function decodedToken(
  token: string,
  secret: string,
): Promise<{
  success: boolean;
  data: jwtPayload | null;
}> {
  try {
    const decodedToken = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );

    if (!decodedToken) {
      return {
        success: false,
        data: null,
      };
    }

    return {
      success: true,
      data: decodedToken.payload as jwtPayload,
    };
  } catch (error) {
    console.error("JWT validation failed:", error);
    return {
      success: false,
      data: null,
    };
  }
}
