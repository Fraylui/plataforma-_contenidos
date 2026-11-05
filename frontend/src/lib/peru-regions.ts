/** Las 25 regiones del Perú, en el orden del mapa escolar (ver PeruRegion.java). */
export const PERU_REGIONS = [
  { key: "AMAZONAS", name: "Amazonas" },
  { key: "ANCASH", name: "Áncash" },
  { key: "APURIMAC", name: "Apurímac" },
  { key: "AREQUIPA", name: "Arequipa" },
  { key: "AYACUCHO", name: "Ayacucho" },
  { key: "CAJAMARCA", name: "Cajamarca" },
  { key: "CALLAO", name: "Callao" },
  { key: "CUSCO", name: "Cusco" },
  { key: "HUANCAVELICA", name: "Huancavelica" },
  { key: "HUANUCO", name: "Huánuco" },
  { key: "ICA", name: "Ica" },
  { key: "JUNIN", name: "Junín" },
  { key: "LA_LIBERTAD", name: "La Libertad" },
  { key: "LAMBAYEQUE", name: "Lambayeque" },
  { key: "LIMA", name: "Lima" },
  { key: "LORETO", name: "Loreto" },
  { key: "MADRE_DE_DIOS", name: "Madre de Dios" },
  { key: "MOQUEGUA", name: "Moquegua" },
  { key: "PASCO", name: "Pasco" },
  { key: "PIURA", name: "Piura" },
  { key: "PUNO", name: "Puno" },
  { key: "SAN_MARTIN", name: "San Martín" },
  { key: "TACNA", name: "Tacna" },
  { key: "TUMBES", name: "Tumbes" },
  { key: "UCAYALI", name: "Ucayali" },
] as const;

export type PeruRegion = (typeof PERU_REGIONS)[number]["key"];

export function regionName(key: string | null | undefined): string | null {
  return PERU_REGIONS.find((r) => r.key === key)?.name ?? null;
}

/** «LA_LIBERTAD» → «la-libertad»: la parte de la dirección /lugares/region/… */
export function regionSlug(key: string): string {
  return key.toLowerCase().replace(/_/g, "-");
}

/** «la-libertad» → «LA_LIBERTAD»; null si no es una región del Perú. */
export function regionFromSlug(slug: string): PeruRegion | null {
  const key = slug.toUpperCase().replace(/-/g, "_");
  return PERU_REGIONS.find((r) => r.key === key)?.key ?? null;
}
