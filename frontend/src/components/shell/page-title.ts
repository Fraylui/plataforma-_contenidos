/** Pestañas y secciones: se llega desde el menú, no llevan flecha. */
const TOP_LEVEL = new Set(["/", "/explorar", "/buscar", "/celebraciones", "/publicaciones", "/lugares", "/galerias", "/series", "/en-vivo"]);

/** Detalles que vuelven a su sección (un tema vuelve al inicio: no hay listado de temas propio). */
const SECTIONS_WITH_DETAIL = new Set(["/publicaciones", "/lugares", "/celebraciones", "/galerias", "/series", "/en-vivo"]);

/**
 * A dónde lleva la flecha de volver de la franja superior; null = sin flecha.
 * La franja ya no repite el nombre de la pantalla (dueño 2026-10-21: «arriba
 * de los contenidos se ven feos»): el menú marca dónde estás y el contenido
 * tiene su propio título.
 */
export function backHref(pathname: string): string | null {
  if (TOP_LEVEL.has(pathname)) return null;
  const section = `/${pathname.split("/")[1] ?? ""}`;
  return SECTIONS_WITH_DETAIL.has(section) ? section : "/";
}
