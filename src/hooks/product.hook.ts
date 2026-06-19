"use client";

import { useApiMutation, useApiQuery } from "@/helpers/tanstack/api";
import {
  productService,
  type ProductAction,
  type ProductsQueryArgs,
} from "@/service/product.service";

const productKeys = {
  all: ["products"] as const,
  list: (params: unknown) => ["products", params] as const,
  detail: (id: string) => ["products", id] as const,
  access: (id: string) => ["products", id, "access"] as const,
};

export const useGetProductsQuery = (args: ProductsQueryArgs = {}) => {
  return useApiQuery(
    productKeys.list(args),
    () => productService.getProducts(args),
    { keepPreviousData: true },
  );
};

export const useGetProductByIdQuery = (id: string) =>
  useApiQuery(productKeys.detail(id), () => productService.getProductById(id), {
    skip: !id,
  });

export const useCheckUserAccessQuery = (id: string) =>
  useApiQuery(
    productKeys.access(id),
    () => productService.checkUserAccess(id),
    { skip: !id },
  );

export const useAddProductMutation = () =>
  useApiMutation({
    mutationFn: productService.addProduct,
    invalidateKeys: [productKeys.all],
  });

export const useUpdateProductMutation = () =>
  useApiMutation({
    mutationFn: productService.updateProduct,
    invalidateKeys: [productKeys.all],
  });

export const useDeleteProductMutation = () =>
  useApiMutation({
    mutationFn: productService.deleteProduct,
    invalidateKeys: [productKeys.all],
  });

export const useUpdateProductActionMutation = () =>
  useApiMutation<ProductAction>({
    mutationFn: productService.updateProductAction,
    invalidateKeys: [productKeys.all],
  });
