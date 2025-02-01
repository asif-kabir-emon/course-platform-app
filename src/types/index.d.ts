export { jwtPayload } from "./jwtPayload.type";
export { OTPType } from "./OTPVerification.type";

declare global {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: "super_admin" | "admin" | "user";
      verified: boolean;
    };
  }
}
