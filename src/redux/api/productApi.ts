import { TagTypes } from "../tagTypes";
import { baseApi } from "./baseApi";
const Route_URL = "/products";

export const ProductApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    addProduct: build.mutation({
      query: (data) => ({
        url: `${Route_URL}`,
        method: "POST",
        data: data,
      }),
      invalidatesTags: [TagTypes.product],
    }),
    getProducts: build.query({
      query: () => ({
        url: `${Route_URL}`,
        method: "GET",
      }),
      providesTags: [TagTypes.product],
    }),
    getProductById: build.query({
      query: (id: string) => ({
        url: `${Route_URL}/${id}`,
        method: "GET",
      }),
      providesTags: [TagTypes.product],
    }),
    updateProduct: build.mutation({
      query: ({ id, body }) => ({
        url: `${Route_URL}/${id}`,
        method: "PUT",
        data: body,
      }),
      invalidatesTags: [TagTypes.product],
    }),
    deleteProduct: build.mutation({
      query: (id: string) => ({
        url: `${Route_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [TagTypes.product],
    }),
    checkUserAccess: build.query({
      query: (id: string) => ({
        url: `${Route_URL}/${id}/user-access`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useAddProductMutation,
  useGetProductsQuery,
  useGetProductByIdQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useCheckUserAccessQuery,
} = ProductApi;
