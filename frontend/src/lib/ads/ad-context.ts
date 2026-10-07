/**
 * Contexto de la página para la segmentación de campañas (ver
 * CampaignTargeting.java): en qué sección del sitio y de qué tema es lo que
 * el visitante está viendo. La ubicación del visitante no va acá: la agrega
 * Cloudflare en cabeceras y el proxy de Next la reenvía.
 */
export type AdSection = "HOME" | "ARTICLE" | "PLACE" | "EVENT" | "GALLERY" | "BUSINESS";

export const AD_SECTIONS: { value: AdSection; label: string }[] = [
  { value: "HOME", label: "Inicio" },
  { value: "ARTICLE", label: "Publicaciones" },
  { value: "PLACE", label: "Lugares" },
  { value: "EVENT", label: "Eventos" },
  { value: "GALLERY", label: "Galerías" },
  { value: "BUSINESS", label: "Directorio" },
];

export interface AdContext {
  section?: AdSection;
  categoryId?: string | null;
}

const SECTION_BY_PREFIX: [string, AdSection][] = [
  ["/publicaciones", "ARTICLE"],
  ["/lugares", "PLACE"],
  ["/eventos", "EVENT"],
  ["/galerias", "GALLERY"],
  ["/directorio", "BUSINESS"],
];

/** Para lo que vive en el layout (barra fija), que no recibe el contexto de cada página. */
export function sectionFromPath(pathname: string): AdSection | undefined {
  if (pathname === "/") return "HOME";
  return SECTION_BY_PREFIX.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1];
}

export function adContextQuery(context: AdContext): string {
  const params = new URLSearchParams();
  if (context.section) params.set("section", context.section);
  if (context.categoryId) params.set("categoryId", context.categoryId);
  const query = params.toString();
  return query ? `&${query}` : "";
}
