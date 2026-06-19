"use client";

import { useApiMutation, useApiQuery } from "@/helpers/tanstack/api";
import {
  purchaseService,
  type PurchaseHistoryArgs,
} from "@/service/purchase.service";

const purchaseKeys = {
  all: ["purchases"] as const,
  mine: ["purchases", "my-purchases"] as const,
  list: (params: unknown) => ["purchases", params] as const,
  detail: (id: string) => ["purchases", id] as const,
  dashboard: ["dashboard", "admin"] as const,
  reliability: ["dashboard", "admin", "reliability"] as const,
};

export const useGetMyPurchaseHistoryQuery = (args?: unknown) => {
  void args;
  return useApiQuery(purchaseKeys.mine, purchaseService.getMyPurchaseHistory);
};

export const useGetPurchaseHistoriesQuery = (args: PurchaseHistoryArgs = {}) => {
  return useApiQuery(
    purchaseKeys.list(args),
    () => purchaseService.getPurchaseHistories(args),
    { keepPreviousData: true },
  );
};

export const useGetPurchaseHistoryByIdQuery = (id: string) =>
  useApiQuery(
    purchaseKeys.detail(id),
    () => purchaseService.getPurchaseHistoryById(id),
    { skip: !id },
  );

export const useRefundPurchaseMutation = () =>
  useApiMutation({
    mutationFn: purchaseService.refundPurchase,
    invalidateKeys: [purchaseKeys.all, purchaseKeys.mine],
  });

export const useGetAdminDashboardDataQuery = (args?: unknown) => {
  void args;
  return useApiQuery(purchaseKeys.dashboard, purchaseService.getAdminDashboardData);
};

export const useGetPaymentReliabilityQuery = (args?: unknown) => {
  void args;
  return useApiQuery(purchaseKeys.reliability, purchaseService.getPaymentReliability);
};
