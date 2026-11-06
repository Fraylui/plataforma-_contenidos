/**
 * Contexto de la página para la segmentación de campañas (ver
 * CampaignTargeting.java): en qué sección del sitio y de qué tema es lo que
 * el visitante está viendo. La ubicación del visitante no va acá: la agrega
 * Cloudflare en cabeceras y el proxy de Next la reenvía.
 */
export type AdSection = "HOME" | "PUBLICATION" | "PLACE" | "CELEBRATION" | "GALLERY" | "SERIES";

export const AD_SECTIONS: { value: AdSection; label: string }[] = [
  { value: "HOME", label: "Inicio" },
  { value: "PUBLICATION", label: "Publicaciones" },
  { value: "PLACE", label: "Lugares" },
  { value: "CELEBRATION", label: "Celebraciones" },
  { value: "GALLERY", label: "Galerías" },
  { value: "SERIES", label: "Series y En vivo" },
];

export interface AdContext {
  section?: AdSection;
  categoryId?: string | null;
}

const SECTION_BY_PREFIX: [string, AdSection][] = [
  ["/publicaciones", "PUBLICATION"],
  ["/lugares", "PLACE"],
  ["/celebraciones", "CELEBRATION"],
  ["/galerias", "GALLERY"],
  // Los videos de YouTube del sitio: programas, episodios y transmisiones.
  ["/series", "SERIES"],
  ["/en-vivo", "SERIES"],
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

/** Detalle de un contenido: /publicaciones/x, /lugares/x, /galerias/x, /celebraciones/x. */
const CONTENT_DETAIL = /^\/(publicaciones|lugares|galerias|celebraciones)\/[^/]+\/?$/;

/**
 * El anuncio fijo de abajo no va en el detalle de un contenido: ahí ya hay
 * uno dentro del texto y dos a la vez tapaban la lectura en el celular
 * (decisión del dueño 2026-10-21: un solo anuncio por detalle).
 */
export function anchorAdAllowed(pathname: string): boolean {
  return !CONTENT_DETAIL.test(pathname);
}
