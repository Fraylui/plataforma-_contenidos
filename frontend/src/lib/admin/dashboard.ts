import type { DashboardKpi, DashboardRange } from "@/lib/api/admin-types";
import type { FeedItemType } from "@/lib/api/types";

export const DASHBOARD_RANGES: readonly DashboardRange[] = [7, 30, 90];

/** ?range de la URL → período válido (30 por defecto: lo que pide el backend). */
export function parseDashboardRange(value: string | string[] | undefined): DashboardRange {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (DASHBOARD_RANGES as readonly number[]).includes(n) ? (n as DashboardRange) : 30;
}

export const CONTENT_TYPE_INFO: Record<FeedItemType, { label: string; adminPath: string; publicPath: string }> = {
  PUBLICATION: { label: "Publicación", adminPath: "/admin/publicaciones", publicPath: "/publicaciones" },
  PLACE: { label: "Lugar", adminPath: "/admin/lugares", publicPath: "/lugares" },
  CELEBRATION: { label: "Celebración", adminPath: "/admin/celebraciones", publicPath: "/celebraciones" },
  GALLERY: { label: "Galería", adminPath: "/admin/galerias", publicPath: "/galerias" },
  BUSINESS: { label: "Directorio", adminPath: "/admin/directorio", publicPath: "/directorio" },
  // Un episodio no tiene pantalla propia en el panel: se gestiona dentro de su serie.
  EPISODE: { label: "Episodio", adminPath: "/admin/series", publicPath: "/series" },
};

export type KpiChange =
  | { kind: "none" }
  | { kind: "new" }
  | { kind: "percent"; value: number };

/** Variación frente al período anterior del mismo largo. Sin datos antes no se inventa un porcentaje. */
export function kpiChange({ current, previous }: DashboardKpi): KpiChange {
  if (previous === 0) return current > 0 ? { kind: "new" } : { kind: "none" };
  return { kind: "percent", value: Math.round(((current - previous) / previous) * 100) };
}

