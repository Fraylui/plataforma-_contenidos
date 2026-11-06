// Registro de actividad (AuditController).
import "server-only";
import type { AuditEvent, AuditSearchFilters } from "../admin-types";
import type { PageResponse } from "../types";
import { authedJson } from "./http";

export function listAdminAuditLog(
  accessToken: string,
  filters: AuditSearchFilters,
): Promise<PageResponse<AuditEvent>> {
  const params = new URLSearchParams();
  if (filters.actorEmail) params.set("actorEmail", filters.actorEmail);
  if (filters.action) params.set("action", filters.action);
  if (filters.resourceType) params.set("resourceType", filters.resourceType);
  if (filters.result) params.set("result", filters.result);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  params.set("page", String(filters.page ?? 0));
  params.set("size", String(filters.size ?? 20));
  return authedJson(`/api/v1/admin/audit?${params.toString()}`, accessToken);
}
