import type { AxiosRequestConfig } from "axios";
import { instance as axiosInstance } from "@/helpers/axios/axiosInstance";

type ApiClientOptions = Omit<RequestInit, "body" | "headers" | "method"> & {
  method?: AxiosRequestConfig["method"];
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
  data?: AxiosRequestConfig["data"];
  params?: AxiosRequestConfig["params"];
  headers?: HeadersInit;
  contentType?: string;
};

const normalizeHeaders = (headers?: HeadersInit): Record<string, string> => {
  if (!headers) {
    return {};
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  return headers;
};

const normalizeBody = (body: ApiClientOptions["body"]) => {
  if (typeof body !== "string") {
    return body;
  }

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

// The app's current service consumers are mostly untyped. Keep this permissive
// until response DTOs are introduced across the feature layer.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiClient = async <T = any>(
  url: string,
  { method = "GET", body, data, params, headers, contentType }: ApiClientOptions = {},
): Promise<T> => {
  const requestData = data ?? normalizeBody(body);
  const isFormData = typeof FormData !== "undefined" && requestData instanceof FormData;

  const result = await axiosInstance({
    url: `/api${url}`,
    method,
    data: requestData,
    params,
    headers: {
      ...(isFormData ? {} : { "Content-Type": contentType || "application/json" }),
      ...normalizeHeaders(headers),
    },
  });

  return (result.data || result) as T;
};
