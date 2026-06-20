import { isAdminRole } from "@/constants/UserRole.constant";
import { ApiError } from "@/utils/apiError";

export function requireAdmin(request: Request) {
  const user = request.user;

  if (!user?.id || !user.email || !user.role || !isAdminRole(user.role)) {
    return ApiError(401, "Unauthorized access!");
  }

  return user;
}

export function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function csvResponse(filename: string, rows: unknown[][]) {
  const body = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  return new Response(`\uFEFF${body}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
