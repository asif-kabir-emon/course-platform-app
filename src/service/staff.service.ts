import { apiClient } from "./api-client";

const ROUTE_URL = "/staff";

export type CreateStaffPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
};

export type StaffActionPayload = {
  id: string;
  action: "disable" | "restore" | "reset_password";
  password?: string;
};

export const staffService = {
  getStaff: () => apiClient(ROUTE_URL),
  createStaff: (data: CreateStaffPayload) =>
    apiClient(ROUTE_URL, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateStaffStatus: ({ id, action, password }: StaffActionPayload) =>
    apiClient(`${ROUTE_URL}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action, password }),
    }),
  deleteStaff: (id: string) =>
    apiClient(`${ROUTE_URL}/${id}`, {
      method: "DELETE",
    }),
};
