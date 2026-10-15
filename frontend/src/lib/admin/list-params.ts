import type { PublicationStatus } from "@/lib/api/types";

/** Estado de un listado del panel paginado en el servidor; vive en la URL (?q&status&sort&page). */
export interface AdminListParams {
  q?: string;
  status?: PublicationStatus;
  sort?: string;
  /** Base 0, como el backend. */
  page: number;
}

const STATUSES: readonly PublicationStatus[] = ["DRAFT", "IN_REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"];

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.trim().length > 0 ? v.trim() : undefined;
}

/** searchParams de la página → parámetros válidos (lo inválido se ignora, nunca rompe la página). */
export function parseAdminListParams(sp: Record<string, string | string[] | undefined>): AdminListParams {
  const status = first(sp.status);
  const page = Number(first(sp.page) ?? "1");
  return {
    q: first(sp.q)?.slice(0, 100),
    status: status && (STATUSES as readonly string[]).includes(status) ? (status as PublicationStatus) : undefined,
    sort: first(sp.sort)?.slice(0, 40),
    // En la URL la página es base 1 (lo que ve la persona); el backend cuenta desde 0.
    page: Number.isInteger(page) && page > 1 ? page - 1 : 0,
  };
}

/** Query string para el backend (GET /api/v1/admin/{tipo}). */
export function adminListQuery(params: AdminListParams, size = 20): string {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.sort) query.set("sort", params.sort);
  query.set("page", String(params.page));
  query.set("size", String(size));
  return query.toString();
}

/** Opciones del filtro de estado, en el orden del flujo. */
export const STATUS_FILTER_OPTIONS: { value: PublicationStatus; label: string }[] = [
  { value: "DRAFT", label: "Borradores" },
  { value: "IN_REVIEW", label: "Para aprobar" },
  { value: "SCHEDULED", label: "Programados" },
  { value: "PUBLISHED", label: "Publicados" },
  { value: "ARCHIVED", label: "Archivados" },
];
