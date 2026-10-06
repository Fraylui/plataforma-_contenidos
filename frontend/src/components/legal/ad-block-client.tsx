"use client";

import { AdSlot } from "@/components/legal/ad-slot";
import { DirectCampaignBanner } from "@/components/legal/direct-campaign-banner";
import { usePlannedCampaign } from "@/components/legal/use-ad-rotation";
import { cn } from "@/lib/utils";
import type { AdContext } from "@/lib/ads/ad-context";

/**
 * Cómo se presenta el anuncio en su contexto:
 *  - "inline": a su medida, centrado (por defecto).
 *  - "fill": ocupa el ancho de su columna (lateral, celda del feed).
 *  - "band": bloque a todo el ancho, sin marco ni fondo (el usuario vio el
 *    contorno con relleno como feo, 2026-10-06: el anuncio va limpio sobre
 *    la página, como en los diarios). Con `count` > 1 es una "fila
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
  context,
}: {
  position: string;
  /** Sección y tema de la página, para la segmentación de las campañas. */
  context?: AdContext;
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
          "flex justify-center gap-4 empty:hidden",
          className,
        )}
      >
        {Array.from({ length: count }, (_, i) => (
          <PlannedAd
            key={i}
            position={position}
            slot={slot + i}
            context={context}
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
      context={context}
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
    <div className={cn("empty:hidden", className)}>
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
  context,
}: {
  position: string;
  slot: number;
  context?: AdContext;
  fill: boolean;
  adsense: AdSense;
  className?: string;
}) {
  const planned = usePlannedCampaign(position, slot, true, context);
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
