import { apiClient } from "./api-client";

const ROUTE_URL = "/purchases";

export type PurchaseHistoryArgs = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
};

export const purchaseService = {
  getMyPurchaseHistory: () => apiClient(`${ROUTE_URL}/my-purchases`),
  getPurchaseHistories: (args: PurchaseHistoryArgs = {}) => {
    const { page = 1, pageSize = 10, search = "", status = "all" } = args;

    return apiClient(
      `${ROUTE_URL}/?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}&status=${status}`,
    );
  },
  getPurchaseHistoryById: (id: string) => apiClient(`${ROUTE_URL}/${id}`),
  refundPurchase: (id: string) =>
    apiClient(`${ROUTE_URL}/${id}`, {
      method: "PUT",
    }),
  getAdminDashboardData: () => apiClient("/dashboard/admin"),
  getPaymentReliability: () => apiClient("/dashboard/admin/reliability"),
};
