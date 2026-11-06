/**
 * Reparto de campañas entre los espacios publicitarios de UNA página vista
 * — la "separación de anunciantes" de los ad servers profesionales:
 *
 *  1. Una campaña nunca aparece dos veces en la página.
 *  2. Cada espacio prefiere un anunciante que todavía no esté en la página
 *     (dos anuncios de la misma empresa a la vista se sienten insistentes);
 *     solo repite anunciante si no hay alternativa.
 *  3. Si no queda ninguna campaña, el espacio queda libre (AdSense o nada).
 *
 * `candidates` llega ya en orden ponderado (WeightedOrder del backend), así
 * que "la primera que cumpla" respeta el peso de cada campaña. Asignar es
 * idempotente por `slotKey`: un espacio que ya se mostró nunca cambia de
 * anuncio aunque después se sumen otros (scroll infinito).
 */
export interface PlannedCampaign {
  id: string;
  advertiserId: string;
}

export interface PageAdPlan<T extends PlannedCampaign> {
  slots: Map<string, T | null>;
  campaigns: Set<string>;
  advertisers: Set<string>;
}

export function createPageAdPlan<T extends PlannedCampaign>(): PageAdPlan<T> {
  return { slots: new Map(), campaigns: new Set(), advertisers: new Set() };
}

export function assignSlot<T extends PlannedCampaign>(plan: PageAdPlan<T>, slotKey: string, candidates: T[]): T | null {
  const existing = plan.slots.get(slotKey);
  if (existing !== undefined) return existing;

  const unused = candidates.filter((c) => !plan.campaigns.has(c.id));
  const chosen = unused.find((c) => !plan.advertisers.has(c.advertiserId)) ?? unused[0] ?? null;

  plan.slots.set(slotKey, chosen);
  if (chosen) {
    plan.campaigns.add(chosen.id);
    plan.advertisers.add(chosen.advertiserId);
  }
  return chosen;
}
