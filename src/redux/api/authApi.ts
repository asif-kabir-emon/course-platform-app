import { baseApi } from "./baseApi";
const Route_URL = "/auth";

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    resetPassword: build.mutation({
      query: (data) => ({
        url: `${Route_URL}/reset-password`,
        method: "POST",
        data: data,
      }),
    }),
  }),
});

export const { useResetPasswordMutation } = authApi;
