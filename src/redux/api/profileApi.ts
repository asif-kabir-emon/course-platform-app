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
  }),
});

export const { useGetUserProfileQuery } = ProfileApi;
