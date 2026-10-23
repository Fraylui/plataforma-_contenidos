/**
 * El logo del anunciante va en un círculo: entre las imágenes ya subidas solo
 * se ofrecen las casi cuadradas (antes salían también los banners 3:1 de las
 * campañas).
 */
export function isNearSquare({ width, height }: { width: number; height: number }): boolean {
  if (!width || !height) return true; // sin medida: no se puede saber, se ofrece
  const ratio = width / height;
  return ratio >= 0.8 && ratio <= 1.25;
}
