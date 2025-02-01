// eslint-disable-next-line @typescript-eslint/no-unused-vars
type jwtPayload = {
  id: string;
  email: string;
  role: "super_admin" | "admin" | "user";
  verified: boolean;
  iat?: number;
  exp?: number;
};
