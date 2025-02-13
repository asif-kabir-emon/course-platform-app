import { TagTypes } from "../tagTypes";
import { baseApi } from "./baseApi";
const Route_URL = "/purchases";

export const PurchasesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPurchaseHistory: build.query({
      query: () => ({
        url: `${Route_URL}`,
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
  }),
});

export const { useGetPurchaseHistoryQuery, useGetPurchaseHistoryByIdQuery } =
  PurchasesApi;
