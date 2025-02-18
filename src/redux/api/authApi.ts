import { baseApi } from "./baseApi";
import { TagTypes } from "../tagTypes"; // Adjust the import path as necessary
const Route_URL = "/auth";

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    resetPassword: build.mutation({
      query: (data) => ({
        url: `${Route_URL}/reset-password`,
        method: "POST",
        data: data,
      }),
      invalidatesTags: [TagTypes.auth],
    }),
    verifyToken: build.query({
      query: ({ revalidateToken = false }: { revalidateToken?: boolean }) => ({
        url: `${Route_URL}/verify-token?revalidateToken=${revalidateToken}`,
        method: "GET",
      }),
      providesTags: [TagTypes.auth],
    }),
  }),
});

export const { useResetPasswordMutation, useVerifyTokenQuery } = authApi;
