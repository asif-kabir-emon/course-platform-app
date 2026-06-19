"use client";

import { useApiMutation, useApiQuery } from "@/helpers/tanstack/api";
import { staffService } from "@/service/staff.service";

const staffKeys = {
  all: ["staff"] as const,
};

export const useGetStaffQuery = () =>
  useApiQuery(staffKeys.all, staffService.getStaff);

export const useCreateStaffMutation = () =>
  useApiMutation({
    mutationFn: staffService.createStaff,
    invalidateKeys: [staffKeys.all],
  });

export const useUpdateStaffStatusMutation = () =>
  useApiMutation({
    mutationFn: staffService.updateStaffStatus,
    invalidateKeys: [staffKeys.all],
  });

export const useDeleteStaffMutation = () =>
  useApiMutation({
    mutationFn: staffService.deleteStaff,
    invalidateKeys: [staffKeys.all],
  });
