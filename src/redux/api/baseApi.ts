import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/helpers/axios/axiosBaseQuery";
import { tagTypesList } from "../tagTypes";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery({
    baseUrl: "/api",
  }),
  endpoints: () => ({}),
  tagTypes: tagTypesList,
});
