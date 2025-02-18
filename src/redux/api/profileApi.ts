import { TagTypes } from "../tagTypes";
import { baseApi } from "./baseApi";
const Route_URL = "/profile";

export const ProfileApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUserProfile: build.query({
      query: () => ({
        url: `${Route_URL}`,
        method: "GET",
      }),
      providesTags: [TagTypes.profile],
    }),
    updateUserProfile: build.mutation({
      query: (data) => ({
        url: `${Route_URL}`,
        method: "PUT",
        data: data,
      }),
      invalidatesTags: [TagTypes.auth, TagTypes.profile],
    }),
  }),
});

export const { useGetUserProfileQuery, useUpdateUserProfileMutation } =
  ProfileApi;
