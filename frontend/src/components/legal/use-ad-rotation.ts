"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { ResolvedCampaign, ResolvedRotation } from "@/lib/api/types";
import { assignSlot, createPageAdPlan, type PageAdPlan } from "@/lib/ads/page-ad-plan";
import { adContextQuery, type AdContext } from "@/lib/ads/ad-context";

/**
 * Un solo pedido por posición y por página vista, compartido por todos los
 * espacios de esa posición (el feed del home repite "en-feed"): el backend
 * devuelve las campañas en orden ponderado y cada espacio toma la suya por
 * índice (ver AdBlockClient) — así la misma campaña nunca se repite en una
 * página. La clave incluye la ruta para que navegar a otra página sí vuelva
 * a pedir (y a rotar).
 */
const pending = new Map<string, Promise<ResolvedRotation | null>>();

function fetchRotation(placement: string, pathname: string, contextQuery: string): Promise<ResolvedRotation | null> {
  const key = `${pathname}|${placement}${contextQuery}`;
  let request = pending.get(key);
  if (!request) {
    request = fetch(`/api/ads/campaign?placement=${encodeURIComponent(placement)}${contextQuery}`)
      .then(async (res) => (res.status === 200 ? ((await res.json()) as ResolvedRotation) : null))
      .catch(() => null);
    pending.set(key, request);
  }
  return request;
}

/**
 * Campañas directas de `placement` para este visitante, pedidas desde el
 * navegador (ver app/api/ads/campaign/route.ts por qué no al renderizar).
 * `undefined` mientras carga, `null` si no hay ninguna que pueda ver.
 */
export function useAdRotation(placement: string, context: AdContext = {}): ResolvedRotation | null | undefined {
  const pathname = usePathname();
  const [result, setResult] = useState<{ key: string; rotation: ResolvedRotation | null } | null>(null);
  const contextQuery = adContextQuery(context);
  const key = `${pathname}|${placement}${contextQuery}`;

  useEffect(() => {
    let cancelled = false;
    fetchRotation(placement, pathname, contextQuery).then((rotation) => {
      if (!cancelled) setResult({ key, rotation });
    });
    return () => {
      cancelled = true;
    };
  }, [placement, pathname, contextQuery, key]);

  return result?.key === key ? result.rotation : undefined;
}

/** Un plan por página vista (misma clave que el pedido): navegar a otra página arranca uno nuevo. */
const plans = new Map<string, PageAdPlan<ResolvedCampaign>>();

/**
 * La campaña que le toca a este espacio (`placement` + `slot`) según el
 * reparto de la página — sin repetir campaña ni, si se puede, anunciante
 * (ver page-ad-plan.ts). `undefined` mientras carga; `campaign: null` si a
 * este espacio no le tocó ninguna (o `null` si `enabled` es false). Asignar es idempotente por espacio, así
 * que hacerlo durante el render es seguro.
 */
export function usePlannedCampaign(
  placement: string,
  slot: number,
  enabled = true,
  context: AdContext = {},
): { rotation: ResolvedRotation; campaign: ResolvedCampaign | null } | null | undefined {
  const pathname = usePathname();
  const rotation = useAdRotation(placement, context);
  // Un espacio que todavía no se muestra no reserva campaña ni anunciante.
  if (!rotation || !enabled) return rotation && null;
  let plan = plans.get(pathname);
  if (!plan) {
    plan = createPageAdPlan<ResolvedCampaign>();
    plans.set(pathname, plan);
  }
  return { rotation, campaign: assignSlot(plan, `${placement}#${slot}`, rotation.campaigns) };
}
