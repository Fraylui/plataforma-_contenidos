/**
 * URL pública del sitio (para metadataBase, sitemap.xml, robots.txt,
 * canonical por defecto y JSON-LD). Server-side únicamente, igual que
 * BACKEND_API_URL en src/lib/api/client.ts.
 */
export const SITE_URL = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
