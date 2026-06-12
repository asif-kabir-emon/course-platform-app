export const OTPType = {
  email_verification: "email_verification",
  phone_verification: "phone_verification",
  login_verification: "login_verification",
  forgot_password_verification: "forgot_password_verification",
} as const;

export type OTPType = (typeof OTPType)[keyof typeof OTPType];
