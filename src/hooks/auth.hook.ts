"use client";

import { useApiMutation } from "@/helpers/tanstack/api";
import { authService } from "@/service/auth.service";

export const useResetPasswordMutation = () =>
  useApiMutation({
    mutationFn: authService.resetPassword,
  });
