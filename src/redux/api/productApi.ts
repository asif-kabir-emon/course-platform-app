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
      query: ({
        showAllProducts = false,
        paginate = false,
        page = 1,
        pageSize = 10,
        search = "",
        status = "all",
        visibility = "all",
      }: {
        showAllProducts?: boolean;
        paginate?: boolean;
        page?: number;
        pageSize?: number;
        search?: string;
        status?: string;
        visibility?: string;
      }) => ({
        url: `${Route_URL}?showAllProducts=${showAllProducts}&paginate=${paginate}&page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}&status=${status}&visibility=${visibility}`,
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
    updateProductAction: build.mutation({
      query: ({
        id,
        action,
      }: {
        id: string;
        action: "publish" | "unpublish" | "archive" | "restore";
      }) => ({
        url: `${Route_URL}/${id}`,
        method: "PATCH",
        data: { action },
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
  useUpdateProductActionMutation,
  useCheckUserAccessQuery,
} = ProductApi;
