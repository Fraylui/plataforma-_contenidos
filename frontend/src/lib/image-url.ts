/**
 * Construye la URL completa de una imagen servida por el backend
 * (ImagePublicController: GET /api/v1/images/{id}/file, público a
 * propósito — un <img src> no puede mandar Authorization). `path` es el
 * valor relativo que ya devuelve ImageResponse.url ("/api/v1/images/{id}/file").
 * Usable en Server y Client Components: NEXT_PUBLIC_* está disponible en
 * ambos (a diferencia de BACKEND_API_URL, que es server-only).
 */
export function imageUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_BACKEND_ASSET_URL ?? "http://localhost:8080";
  return `${base}${path}`;
}
