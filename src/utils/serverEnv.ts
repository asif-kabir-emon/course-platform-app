export const getJwtSecret = () => {
  const secret =
    process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || "";

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return secret;
};
