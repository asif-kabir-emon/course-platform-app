import { apiClient } from "./api-client";

const ROUTE_URL = "/profile";

export const profileService = {
  getUserProfile: () => apiClient(ROUTE_URL),
  updateUserProfile: (data: unknown) =>
    apiClient(ROUTE_URL, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
