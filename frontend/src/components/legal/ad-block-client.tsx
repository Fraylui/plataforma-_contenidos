"use client";

import { AdSlot } from "@/components/legal/ad-slot";
import { DirectCampaignBanner } from "@/components/legal/direct-campaign-banner";
import { usePlannedCampaign } from "@/components/legal/use-ad-rotation";
import { cn } from "@/lib/utils";

/**
 * Cómo se presenta el anuncio en su contexto:
 *  - "inline": a su medida, centrado (por defecto).
 *  - "fill": ocupa el ancho de su columna (lateral, celda del feed).
 *  - "band": dentro de una franja de fondo suave a todo el ancho (cabecera
 *    y final de listados, final del artículo). Con `count` > 1 es una "fila
 *    patrocinada" (MSN, diarios): hasta `count` campañas distintas lado a
 *    lado, que llenan el ancho en vez de dejar un 300×250 solo en medio de
 *    1200 px. Con una sola campaña disponible queda una, centrada en su
 *    franja; en celular siempre una sola (no saturar).
 */
export type AdLayout = "inline" | "fill" | "band";

type AdSense = { clientId: string; slot: string } | null;

/**
 * Mitad cliente de AdBlock: primero las campañas directas de la posición;
 * si no hay una para este espacio, cae a la unidad de AdSense (si está
 * configurada). Mientras pregunta no muestra nada — la pauta nunca debe
 * dejar un hueco vacío cuando al final no hay anuncio.
 *
 * `slot`: índice del espacio dentro de la página para esta posición (el
 * feed del home repite "en-feed"). El reparto de la página (page-ad-plan)
 * le da a cada uno otra campaña y, si se puede, otro anunciante; si hay más
 * espacios que campañas, los sobrantes van a AdSense o quedan vacíos.
 */
export function AdBlockClient({
  position,
  slot = 0,
  count = 1,
  layout = "inline",
  className,
  adsense,
}: {
  position: string;
  slot?: number;
  /** Solo con layout "band": cuántas campañas distintas como máximo en la fila. */
  count?: number;
  layout?: AdLayout;
  className?: string;
  adsense: AdSense;
}) {
  if (layout === "band" && count > 1) {
    return (
      // empty:hidden — si ningún espacio de la fila recibió anuncio, la franja no se dibuja.
      <div
        className={cn(
          "flex justify-center gap-4 rounded-2xl border border-canvas-border bg-canvas-strong px-4 py-5 empty:hidden sm:py-6",
          className,
        )}
      >
        {Array.from({ length: count }, (_, i) => (
          <PlannedAd
            key={i}
            position={position}
            slot={slot + i}
            fill
            // AdSense solo en el primero: una fila de unidades de Google no aporta y satura.
            adsense={i === 0 ? adsense : null}
            // mx-0: en la fila los márgenes automáticos del banner separarían los anuncios hacia los extremos.
            className={cn("mx-0 min-w-0", i > 0 && "hidden sm:block")}
          />
        ))}
      </div>
    );
  }

  const band = layout === "band";
  const ad = (
    <PlannedAd
      position={position}
      slot={slot}
      fill={layout === "fill"}
      adsense={adsense}
      className={band ? undefined : className}
    />
  );
  if (!band) return ad;
  return <BandIfFilled className={className}>{ad}</BandIfFilled>;
}

function BandIfFilled({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-canvas-border bg-canvas-strong px-4 py-5 empty:hidden sm:py-6", className)}>
      {children}
    </div>
  );
}

function PlannedAd({
  position,
  slot,
  fill,
  adsense,
  className,
}: {
  position: string;
  slot: number;
  fill: boolean;
  adsense: AdSense;
  className?: string;
}) {
  const planned = usePlannedCampaign(position, slot);
  if (planned === undefined) return null;
  if (planned?.campaign) {
    const { rotation, campaign } = planned;
    return (
      <DirectCampaignBanner
        campaign={campaign}
        width={rotation.width}
        height={rotation.height}
        fill={fill}
        className={className}
      />
    );
  }
  if (!adsense) return null;
  return <AdSlot clientId={adsense.clientId} slot={adsense.slot} className={className} />;
}
