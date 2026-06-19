"use client";

import {
  keepPreviousData,
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { AxiosRequestConfig } from "axios";
import { useCallback } from "react";
import { instance as axiosInstance } from "@/helpers/axios/axiosInstance";

type ApiRequestConfig = {
  url: string;
  method?: AxiosRequestConfig["method"];
  data?: AxiosRequestConfig["data"];
  params?: AxiosRequestConfig["params"];
  headers?: AxiosRequestConfig["headers"];
  contentType?: string;
};

type QueryOptions = {
  skip?: boolean;
  refetchOnFocus?: boolean;
  refetchOnMountOrArgChange?: boolean;
  keepPreviousData?: boolean;
};

type MutationPromise<T> = Promise<T> & {
  unwrap: () => Promise<T>;
};

// The legacy RTK Query hooks were untyped at call sites. Keep the adapter
// permissive so the migration does not force unrelated UI rewrites.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiRequest = async <T = any>({
  url,
  method = "GET",
  data,
  params,
  headers,
  contentType,
}: ApiRequestConfig): Promise<T> => {
  const result = await axiosInstance({
    url: `/api${url}`,
    method,
    data,
    params,
    headers: {
      "Content-Type": contentType || "application/json",
      ...headers,
    },
  });

  return (result.data || result) as T;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useApiQuery = <TData = any>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options: QueryOptions = {},
) => {
  return useQuery({
    queryKey,
    queryFn,
    enabled: !options.skip,
    refetchOnWindowFocus: options.refetchOnFocus,
    refetchOnMount: options.refetchOnMountOrArgChange,
    placeholderData: options.keepPreviousData ? keepPreviousData : undefined,
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useApiMutation = <TVariables = any, TData = any>({
  mutationFn,
  invalidateKeys = [],
  getInvalidateKeys,
}: {
  mutationFn: (variables: TVariables) => Promise<TData>;
  invalidateKeys?: QueryKey[];
  getInvalidateKeys?: (variables: TVariables, data: TData) => QueryKey[];
}) => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      const keys = [
        ...invalidateKeys,
        ...(getInvalidateKeys?.(variables, data) ?? []),
      ];

      keys.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
    },
  });
  const { mutateAsync } = mutation;

  const trigger = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (variables?: any): MutationPromise<TData> => {
      const promise = mutateAsync(variables) as MutationPromise<TData>;
      promise.unwrap = () => promise;
      return promise;
    },
    [mutateAsync],
  );

  return [
    trigger,
    {
      ...mutation,
      isLoading: mutation.isPending,
    },
  ] as const;
};
