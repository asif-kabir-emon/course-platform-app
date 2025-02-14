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
      query: () => ({
        url: `${Route_URL}/`,
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
  }),
});

export const {
  useGetMyPurchaseHistoryQuery,
  useGetPurchaseHistoriesQuery,
  useGetPurchaseHistoryByIdQuery,
  useRefundPurchaseMutation,
} = PurchasesApi;
