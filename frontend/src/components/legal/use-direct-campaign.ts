"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { ResolvedCampaign } from "@/lib/api/types";

/**
 * Un solo pedido por posición y por página vista: el feed del home repite
 * el espacio "en-feed" cada pocas tarjetas, y sin esto cada repetición
 * pedía (y contaba como impresión) la misma campaña otra vez. La clave
 * incluye la ruta para que navegar a otra página sí vuelva a pedir.
 */
const pending = new Map<string, Promise<ResolvedCampaign | null>>();

function fetchCampaign(placement: string, pathname: string): Promise<ResolvedCampaign | null> {
  const key = `${pathname}|${placement}`;
  let request = pending.get(key);
  if (!request) {
    request = fetch(`/api/ads/campaign?placement=${encodeURIComponent(placement)}`)
      .then(async (res) => (res.status === 200 ? ((await res.json()) as ResolvedCampaign) : null))
      .catch(() => null);
    pending.set(key, request);
  }
  return request;
}

/**
 * Campaña directa vigente para `placement`, pedida desde el navegador (ver
 * app/api/ads/campaign/route.ts por qué no al renderizar). `undefined`
 * mientras carga, `null` si no hay ninguna vendida para esa posición.
 */
export function useDirectCampaign(placement: string): ResolvedCampaign | null | undefined {
  const pathname = usePathname();
  const [result, setResult] = useState<{ key: string; campaign: ResolvedCampaign | null } | null>(null);
  const key = `${pathname}|${placement}`;

  useEffect(() => {
    let cancelled = false;
    fetchCampaign(placement, pathname).then((campaign) => {
      if (!cancelled) setResult({ key, campaign });
    });
    return () => {
      cancelled = true;
    };
  }, [placement, pathname, key]);

  return result?.key === key ? result.campaign : undefined;
}
