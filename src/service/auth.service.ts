import { apiClient } from "./api-client";

type ResetPasswordOptions = {
  token?: string;
};

export const authService = {
  signIn: (data: unknown) =>
    apiClient("/auth/sign-in", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  signUpUser: (data: unknown) =>
    apiClient("/auth/sign-up/user", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  sendOtp: (data: unknown) =>
    apiClient("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  verifyOtp: (data: unknown) =>
    apiClient("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  resetPassword: (data: unknown) =>
    apiClient("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  resetPasswordWithToken: (data: unknown, options: ResetPasswordOptions = {}) =>
    apiClient("/auth/reset-password", {
      method: "POST",
      headers: options.token
        ? {
            Authorization: `Bearer ${options.token}`,
          }
        : undefined,
      body: JSON.stringify(data),
    }),
};
