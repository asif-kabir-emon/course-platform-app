import { apiClient } from "./api-client";

const ROUTE_URL = "/sections";

export const sectionService = {
  getSections: () => apiClient(ROUTE_URL),
  getSectionById: (id: string) => apiClient(`${ROUTE_URL}/${id}`),
  addSection: (data: unknown) =>
    apiClient(ROUTE_URL, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateSection: ({ id, body }: { id: string; body: unknown }) =>
    apiClient(`${ROUTE_URL}/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteSection: (id: string) =>
    apiClient(`${ROUTE_URL}/${id}`, {
      method: "DELETE",
    }),
  reorderSections: (sectionIds: string[]) =>
    apiClient(`${ROUTE_URL}/order`, {
      method: "PUT",
      body: JSON.stringify({ sectionIds }),
    }),
};
