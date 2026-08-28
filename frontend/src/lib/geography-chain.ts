import { getGeographyUnitById } from "@/lib/api/client";
import type { GeographicUnit } from "@/lib/api/types";

/**
 * Camino PAIS -> ... -> unidad seleccionada, para precargar el selector en
 * cascada (ListingFilters, GeographyPicker) a partir de un geographyId
 * suelto (ej. el que llega por query string en un listado público).
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
