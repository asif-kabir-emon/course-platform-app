import { OTPVerification } from "@/constants/OTPVerification.constant";

export type OTPType = (typeof OTPVerification)[keyof typeof OTPVerification];
