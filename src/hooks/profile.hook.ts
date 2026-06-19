"use client";

import { useApiMutation, useApiQuery } from "@/helpers/tanstack/api";
import { profileService } from "@/service/profile.service";

const profileKeys = {
  detail: ["profile"] as const,
};

export const useGetUserProfileQuery = (args?: unknown) => {
  void args;
  return useApiQuery(profileKeys.detail, profileService.getUserProfile);
};

export const useUpdateUserProfileMutation = () =>
  useApiMutation({
    mutationFn: profileService.updateUserProfile,
    invalidateKeys: [profileKeys.detail],
  });
