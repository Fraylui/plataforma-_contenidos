import "server-only";

/**
 * URL de imagen para pasar a next/image (<Image>/<SkeletonImage>), NUNCA a
 * un <img src> plano — usar imageUrl() (lib/image-url.ts) para eso.
 *
 * next/image optimiza la imagen en el servidor de Next (la ruta interna
 * /_next/image hace el fetch desde el proceso Node, no desde el navegador),
 * así que necesita una URL alcanzable DESDE ESE SERVIDOR, no desde el
 * navegador del visitante. En Docker eso es BACKEND_API_URL
 * (http://backend:8080, red interna del compose) — NEXT_PUBLIC_BACKEND_ASSET_URL
 * (http://localhost:8080) solo es alcanzable desde la máquina del
 * visitante, nunca desde dentro del contenedor del frontend, y usarla acá
 * causaba 400 Bad Request en /_next/image en producción (encontrado
 * inspeccionando la consola real del sitio corriendo en Docker).
 */
export function serverImageUrl(path: string): string {
  const base = process.env.BACKEND_API_URL ?? "http://localhost:8080";
  return `${base}${path}`;
}
