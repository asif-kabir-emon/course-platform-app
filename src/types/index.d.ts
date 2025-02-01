export { jwtPayload } from "./jwtPayload.type";
export { OTPType } from "./OTPVerification.type";

declare global {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
      verified: boolean;
    };
  }
}
