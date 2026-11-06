/**
 * Tamaños estándar de la IAB que ofrece el panel al crear una posición. La
 * medida es lo que el anunciante recibe como especificación ("diseñá tu
 * banner a 300×250"); el sitio lo muestra entero, sin recortes.
 */
export const IAB_FORMATS = [
  { width: 300, height: 250, label: "Rectángulo medio — feed, columna lateral, contenido" },
  { width: 728, height: 90, label: "Leaderboard — franja ancha de escritorio" },
  { width: 320, height: 50, label: "Banner móvil — barra flotante" },
  { width: 320, height: 100, label: "Banner móvil grande" },
  { width: 300, height: 600, label: "Media página — columna lateral alta" },
  { width: 970, height: 250, label: "Billboard — cabecera grande de escritorio" },
] as const;

/** Misma tolerancia que CampaignService.ASPECT_TOLERANCE (redondeos al exportar la imagen). */
const ASPECT_TOLERANCE = 0.02;

export type CreativeFit =
  | { ok: true; retina: boolean }
  | { ok: false; reason: "aspect" | "small" };

/**
 * ¿La creatividad sirve para la posición? Misma regla que valida el backend
 * para imágenes subidas: proporción exacta (se muestra entera) y al menos el
 * ancho de la posición (más chica se ve borrosa). `retina`: tiene el doble,
 * lo recomendado para pantallas de alta densidad.
 */
export function creativeFit(imageWidth: number, imageHeight: number, width: number, height: number): CreativeFit {
  const expected = width / height;
  const actual = imageWidth / imageHeight;
  if (Math.abs(actual - expected) / expected > ASPECT_TOLERANCE) return { ok: false, reason: "aspect" };
  if (imageWidth < width) return { ok: false, reason: "small" };
  return { ok: true, retina: imageWidth >= width * 2 };
}

export function formatSize(width: number, height: number): string {
  return `${width}×${height}`;
}
