import { getPlatformSettings, listActiveAdPlacements } from "@/lib/api/client";
import { AdBlockClient } from "@/components/legal/ad-block-client";

/**
 * Punto de inserción de anuncios listo para usar en cualquier página
 * pública: `<AdBlock position="article" />`. `position` es la `key` de una
 * posición creada en Configuración → Publicidad (módulo `advertising`, ver
 * AdPlacement.java) — agregar una posición nueva no requiere tocar este
 * componente, solo crearla en el admin y usar su key acá.
 *
 * Lo que se resuelve acá (configuración de AdSense y posiciones) está en
 * caché y es igual para todos; la campaña directa, que cambia por visita y
 * cuenta impresiones, la elige el navegador (AdBlockClient) para que la
 * página siga siendo cacheable.
 */
export async function AdBlock({ position, className }: { position: string; className?: string }) {
  const [settings, placements] = await Promise.all([getPlatformSettings(), listActiveAdPlacements()]);
  const slot = placements.find((p) => p.key === position)?.adsenseSlotId;
  const adsense = settings.adsenseEnabled && settings.adsenseClientId && slot ? { clientId: settings.adsenseClientId, slot } : null;

  return <AdBlockClient position={position} className={className} adsense={adsense} />;
}
