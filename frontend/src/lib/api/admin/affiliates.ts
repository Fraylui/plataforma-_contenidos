// Enlaces de afiliado de publicaciones y lugares (AffiliateAdminController).
import "server-only";
import type { AffiliateContentType, AffiliateLink, AffiliateLinkInput } from "../admin-types";
import { authedJson } from "./http";

function path(type: AffiliateContentType, contentId: string) {
  return `/api/v1/admin/affiliate-links/${type}/${encodeURIComponent(contentId)}`;
}

export function listAffiliateLinks(accessToken: string, type: AffiliateContentType, contentId: string): Promise<AffiliateLink[]> {
  return authedJson(path(type, contentId), accessToken);
}

export function saveAffiliateLinks(
  accessToken: string,
  type: AffiliateContentType,
  contentId: string,
  links: AffiliateLinkInput[],
): Promise<AffiliateLink[]> {
  return authedJson(path(type, contentId), accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ links }),
  });
}
