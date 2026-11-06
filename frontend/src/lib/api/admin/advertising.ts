// Publicidad directa: espacios, anunciantes y campañas (Ad*/Advertiser*/CampaignAdminController).
import "server-only";
import type {
  AdPlacementCreateInput,
  AdPlacementUpdateInput,
  Advertiser,
  AdvertiserInput,
  Campaign,
  CampaignDailyStat,
  CampaignInput,
} from "../admin-types";
import type { AdPlacement } from "../types";
import { authedJson } from "./http";

export function listAdminAdPlacements(accessToken: string): Promise<AdPlacement[]> {
  return authedJson("/api/v1/admin/ad-placements", accessToken);
}

export function getAdminAdPlacement(accessToken: string, id: string): Promise<AdPlacement> {
  return authedJson(`/api/v1/admin/ad-placements/${encodeURIComponent(id)}`, accessToken);
}

export function createAdPlacement(accessToken: string, input: AdPlacementCreateInput): Promise<AdPlacement> {
  return authedJson("/api/v1/admin/ad-placements", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateAdPlacement(
  accessToken: string,
  id: string,
  input: AdPlacementUpdateInput,
): Promise<AdPlacement> {
  return authedJson(`/api/v1/admin/ad-placements/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function activateAdPlacement(accessToken: string, id: string): Promise<void> {
  return authedJson(`/api/v1/admin/ad-placements/${encodeURIComponent(id)}/activate`, accessToken, {
    method: "POST",
  });
}

export function deactivateAdPlacement(accessToken: string, id: string): Promise<void> {
  return authedJson(`/api/v1/admin/ad-placements/${encodeURIComponent(id)}/deactivate`, accessToken, {
    method: "POST",
  });
}

export function deleteAdPlacement(accessToken: string, id: string): Promise<void> {
  return authedJson(`/api/v1/admin/ad-placements/${encodeURIComponent(id)}`, accessToken, { method: "DELETE" });
}

export function listAdvertisers(accessToken: string): Promise<Advertiser[]> {
  return authedJson("/api/v1/admin/advertisers", accessToken);
}

export function getAdvertiser(accessToken: string, id: string): Promise<Advertiser> {
  return authedJson(`/api/v1/admin/advertisers/${encodeURIComponent(id)}`, accessToken);
}

export function createAdvertiser(accessToken: string, input: AdvertiserInput): Promise<Advertiser> {
  return authedJson("/api/v1/admin/advertisers", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateAdvertiser(accessToken: string, id: string, input: AdvertiserInput): Promise<Advertiser> {
  return authedJson(`/api/v1/admin/advertisers/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function deleteAdvertiser(accessToken: string, id: string): Promise<void> {
  return authedJson(`/api/v1/admin/advertisers/${encodeURIComponent(id)}`, accessToken, { method: "DELETE" });
}

export function listCampaigns(accessToken: string, advertiserId?: string): Promise<Campaign[]> {
  const query = advertiserId ? `?advertiserId=${encodeURIComponent(advertiserId)}` : "";
  return authedJson(`/api/v1/admin/campaigns${query}`, accessToken);
}

export function getCampaign(accessToken: string, id: string): Promise<Campaign> {
  return authedJson(`/api/v1/admin/campaigns/${encodeURIComponent(id)}`, accessToken);
}

/** Impresiones visibles y clics válidos por día (UTC) — ver CampaignAdminController.stats. */
export function getCampaignStats(accessToken: string, id: string, days = 30): Promise<CampaignDailyStat[]> {
  return authedJson(`/api/v1/admin/campaigns/${encodeURIComponent(id)}/stats?days=${days}`, accessToken);
}

export function createCampaign(accessToken: string, input: CampaignInput): Promise<Campaign> {
  return authedJson("/api/v1/admin/campaigns", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateCampaign(accessToken: string, id: string, input: CampaignInput): Promise<Campaign> {
  return authedJson(`/api/v1/admin/campaigns/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function activateCampaign(accessToken: string, id: string): Promise<void> {
  return authedJson(`/api/v1/admin/campaigns/${encodeURIComponent(id)}/activate`, accessToken, { method: "POST" });
}

export function deactivateCampaign(accessToken: string, id: string): Promise<void> {
  return authedJson(`/api/v1/admin/campaigns/${encodeURIComponent(id)}/deactivate`, accessToken, { method: "POST" });
}

export function deleteCampaign(accessToken: string, id: string): Promise<void> {
  return authedJson(`/api/v1/admin/campaigns/${encodeURIComponent(id)}`, accessToken, { method: "DELETE" });
}
