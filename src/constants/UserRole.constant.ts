export const UserRole = {
  super_admin: "super_admin",
  admin: "admin",
  user: "user",
} as const;

export const isAdminRole = (role?: string | null) =>
  role === UserRole.admin || role === UserRole.super_admin;

export const isSuperAdminRole = (role?: string | null) =>
  role === UserRole.super_admin;
