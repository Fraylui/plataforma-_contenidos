import { getPlatformSettings } from "@/lib/api/client";
import { AdSlot } from "@/components/legal/ad-slot";

/**
 * Punto de inserción de anuncios listo para usar en cualquier página
 * pública: `<AdBlock position="article" />`. No muestra nada hasta que el
 * admin active AdSense y complete el slot correspondiente en Configuración
 * (platformSettings.adsenseSlotArticle/adsenseSlotListing) — así queda
 * preparado sin necesidad de solicitar la revisión de AdSense todavía.
 */
export async function AdBlock({ position, className }: { position: "article" | "listing"; className?: string }) {
  const settings = await getPlatformSettings();
  if (!settings.adsenseEnabled || !settings.adsenseClientId) return null;

  const slot = position === "article" ? settings.adsenseSlotArticle : settings.adsenseSlotListing;
  if (!slot) return null;

  return <AdSlot clientId={settings.adsenseClientId} slot={slot} className={className} />;
}
