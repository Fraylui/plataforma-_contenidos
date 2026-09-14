import { getPlatformSettings, listActiveAdPlacements } from "@/lib/api/client";
import { AdSlot } from "@/components/legal/ad-slot";

/**
 * Punto de inserción de anuncios listo para usar en cualquier página
 * pública: `<AdBlock position="article" />`. `position` es la `key` de una
 * posición creada en Configuración → Publicidad (módulo `advertising`, ver
 * AdPlacement.java) — agregar una posición nueva no requiere tocar este
 * componente, solo crearla en el admin y usar su key acá. No muestra nada
 * hasta que el admin active AdSense globalmente Y la posición tenga su slot
 * completo y esté habilitada.
 */
export async function AdBlock({ position, className }: { position: string; className?: string }) {
  const settings = await getPlatformSettings();
  if (!settings.adsenseEnabled || !settings.adsenseClientId) return null;

  const placements = await listActiveAdPlacements();
  const placement = placements.find((p) => p.key === position);
  if (!placement?.adsenseSlotId) return null;

  return <AdSlot clientId={settings.adsenseClientId} slot={placement.adsenseSlotId} className={className} />;
}
