import { getPlatformSettings } from "@/lib/api/client";

/**
 * ads.txt (IAB/Google): declara quién está autorizado a vender inventario
 * publicitario de este dominio — sin este archivo, AdSense marca el sitio
 * con "problemas de ads.txt" en Search Console/AdSense y puede limitar el
 * llenado de anuncios aunque la cuenta ya esté aprobada.
 *
 * Se genera desde `platformSettings.adsenseClientId` (formato
 * "ca-pub-XXXXXXXXXXXXXXXX") en vez de vivir como archivo estático en
 * `public/`: el ID de AdSense se configura en el admin, no se hardcodea.
 * Mismo patrón que robots.ts/sitemap.ts (ruta generada, no archivo suelto).
 */
export async function GET() {
  const settings = await getPlatformSettings();
  const pubId = settings.adsenseClientId?.replace(/^ca-/, "");

  const body = settings.adsenseEnabled && pubId ? `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n` : "";

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
