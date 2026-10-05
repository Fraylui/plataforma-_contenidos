"use client";

import { useEffect, useState } from "react";
import type { ResolvedCampaign } from "@/lib/api/types";

/**
 * Campaña directa vigente para `placement`, pedida desde el navegador (ver
 * app/api/ads/campaign/route.ts por qué no al renderizar). `undefined`
 * mientras carga, `null` si no hay ninguna vendida para esa posición.
 */
export function useDirectCampaign(placement: string): ResolvedCampaign | null | undefined {
  const [campaign, setCampaign] = useState<ResolvedCampaign | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ads/campaign?placement=${encodeURIComponent(placement)}`)
      .then(async (res) => (res.status === 200 ? ((await res.json()) as ResolvedCampaign) : null))
      .catch(() => null)
      .then((result) => {
        if (!cancelled) setCampaign(result);
      });
    return () => {
      cancelled = true;
    };
  }, [placement]);

  return campaign;
}
