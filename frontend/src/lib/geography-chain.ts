import { getGeographyUnitById } from "@/lib/api/client";
import type { GeographicUnit } from "@/lib/api/types";

/**
 * Camino PAIS -> ... -> unidad seleccionada, para precargar el selector en
 * cascada de geografía a partir de un geographyId suelto. Hoy solo lo usan
 * los formularios de edición del admin (Publicaciones/Lugares/Eventos/
 * Galerías/Reseñas/Directorio) — el selector equivalente en /buscar se quitó
 * junto con el resto de filtros de geografía en los listados públicos.
 */
export async function resolveGeographyChain(geographyId: string | null | undefined): Promise<GeographicUnit[]> {
  if (!geographyId) return [];
  const chain: GeographicUnit[] = [];
  let current: GeographicUnit | null = await getGeographyUnitById(geographyId).catch(() => null);
  while (current) {
    chain.unshift(current);
    current = current.parentId ? await getGeographyUnitById(current.parentId).catch(() => null) : null;
  }
  return chain;
}
