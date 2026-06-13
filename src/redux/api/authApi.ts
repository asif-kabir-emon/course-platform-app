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
  }),
});

export const { useResetPasswordMutation } = authApi;
