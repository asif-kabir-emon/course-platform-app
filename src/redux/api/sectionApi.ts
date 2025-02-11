import { TagTypes } from "../tagTypes";
import { baseApi } from "./baseApi";
const Route_URL = "/sections";

export const SectionApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    addSection: build.mutation({
      query: (data) => ({
        url: `${Route_URL}`,
        method: "POST",
        data: data,
      }),
      invalidatesTags: [TagTypes.course, TagTypes.section],
    }),
    getSections: build.query({
      query: () => ({
        url: `${Route_URL}`,
        method: "GET",
      }),
      providesTags: [TagTypes.section],
    }),
    getSectionById: build.query({
      query: (id: string) => ({
        url: `${Route_URL}/${id}`,
        method: "GET",
      }),
      providesTags: [TagTypes.section],
    }),
    updateSection: build.mutation({
      query: ({ id, body }) => ({
        url: `${Route_URL}/${id}`,
        method: "PUT",
        data: body,
      }),
      invalidatesTags: [TagTypes.course, TagTypes.section],
    }),
    deleteSection: build.mutation({
      query: (id: string) => ({
        url: `${Route_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [TagTypes.course, TagTypes.section],
    }),
    reorderedSections: build.mutation({
      query: (sectionIds: string[]) => ({
        url: `${Route_URL}/order`,
        method: "PUT",
        data: { sectionIds },
      }),
      invalidatesTags: [TagTypes.course, TagTypes.section],
    }),
  }),
});

export const {
  useAddSectionMutation,
  useGetSectionsQuery,
  useGetSectionByIdQuery,
  useUpdateSectionMutation,
  useDeleteSectionMutation,
  useReorderedSectionsMutation,
} = SectionApi;
