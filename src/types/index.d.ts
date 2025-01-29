export { jwtPayload } from "./jwtPayload.type";

declare global {
  interface Request {
    user?: {
      id: string;
      email: string;
    };
  }
}
