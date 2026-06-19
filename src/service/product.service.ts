import { apiClient } from "./api-client";

const ROUTE_URL = "/products";

export type ProductsQueryArgs = {
  showAllProducts?: boolean;
  paginate?: boolean;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  visibility?: string;
};

export type ProductAction = {
  id: string;
  action: "publish" | "unpublish" | "archive" | "restore";
};

export const productService = {
  getProducts: (args: ProductsQueryArgs = {}) => {
    const {
      showAllProducts = false,
      paginate = false,
      page = 1,
      pageSize = 10,
      search = "",
      status = "all",
      visibility = "all",
    } = args;

    return apiClient(
      `${ROUTE_URL}?showAllProducts=${showAllProducts}&paginate=${paginate}&page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}&status=${status}&visibility=${visibility}`,
    );
  },
  getProductById: (id: string) => apiClient(`${ROUTE_URL}/${id}`),
  checkUserAccess: (id: string) => apiClient(`${ROUTE_URL}/${id}/user-access`),
  addProduct: (data: unknown) =>
    apiClient(ROUTE_URL, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProduct: ({ id, body }: { id: string; body: unknown }) =>
    apiClient(`${ROUTE_URL}/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteProduct: (id: string) =>
    apiClient(`${ROUTE_URL}/${id}`, {
      method: "DELETE",
    }),
  updateProductAction: ({ id, action }: ProductAction) =>
    apiClient(`${ROUTE_URL}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    }),
};
