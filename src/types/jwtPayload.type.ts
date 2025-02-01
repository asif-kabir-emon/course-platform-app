// eslint-disable-next-line @typescript-eslint/no-unused-vars
type jwtPayload = {
  id: string;
  email: string;
  role: string;
  verified: boolean;
  iat?: number;
  exp?: number;
};
