import { getPlatformSettings } from "@/lib/api/client";

/**
 * ads.txt (IAB/Google): declara qué vendedores están autorizados a vender
 * espacio publicitario de este dominio. Google exige que exista para
 * aprobar/mantener una cuenta de AdSense. `adsenseClientId` se guarda como
 * "ca-pub-XXXXXXXXXXXXXXXX" (formato del script de AdSense); ads.txt usa el
 * mismo ID sin el prefijo "ca-".
 */
export async function GET(): Promise<Response> {
  const settings = await getPlatformSettings();

  if (!settings.adsenseEnabled || !settings.adsenseClientId) {
    return new Response("", { headers: { "Content-Type": "text/plain" } });
  }

  const publisherId = settings.adsenseClientId.replace(/^ca-/, "");
  const body = `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}
