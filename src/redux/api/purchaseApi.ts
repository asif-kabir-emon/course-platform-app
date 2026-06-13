import { TagTypes } from "../tagTypes";
import { baseApi } from "./baseApi";
const Route_URL = "/purchases";

export const PurchasesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMyPurchaseHistory: build.query({
      query: () => ({
        url: `${Route_URL}/my-purchases`,
        method: "GET",
      }),
      providesTags: [TagTypes.purchases],
    }),
    getPurchaseHistories: build.query({
      query: ({
        page = 1,
        pageSize = 10,
        search = "",
        status = "all",
      }: {
        page?: number;
        pageSize?: number;
        search?: string;
        status?: string;
      }) => ({
        url: `${Route_URL}/?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}&status=${status}`,
        method: "GET",
      }),
      providesTags: [TagTypes.purchases],
    }),
    getPurchaseHistoryById: build.query({
      query: (id: string) => ({
        url: `${Route_URL}/${id}`,
        method: "GET",
      }),
      providesTags: [TagTypes.purchases],
    }),
    refundPurchase: build.mutation({
      query: (id: string) => ({
        url: `${Route_URL}/${id}`,
        method: "PUT",
      }),
      invalidatesTags: [TagTypes.purchases],
    }),

    // Admin Dashboard
    getAdminDashboardData: build.query({
      query: () => ({
        url: `/dashboard/admin`,
        method: "GET",
      }),
      providesTags: [
        TagTypes.purchases,
        TagTypes.product,
        TagTypes.course,
        TagTypes.section,
        TagTypes.lesson,
      ],
    }),
    getPaymentReliability: build.query({
      query: () => ({
        url: `/dashboard/admin/reliability`,
        method: "GET",
      }),
      providesTags: [TagTypes.purchases],
    }),
  }),
});

export const {
  useGetMyPurchaseHistoryQuery,
  useGetPurchaseHistoriesQuery,
  useGetPurchaseHistoryByIdQuery,
  useRefundPurchaseMutation,
  useGetAdminDashboardDataQuery,
  useGetPaymentReliabilityQuery,
} = PurchasesApi;
