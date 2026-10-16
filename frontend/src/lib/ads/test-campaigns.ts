import type { ResolvedCampaign } from "@/lib/api/types";

/** Para pruebas: lo que un banner trae en null (los campos del anuncio nativo). */
export const BANNER_FIELDS: Omit<ResolvedCampaign, "id" | "advertiserId" | "imageSrc" | "externalImageUrl" | "imageAlt"> = {
  format: "BANNER",
  advertiserName: null,
  advertiserLogoSrc: null,
  primaryText: null,
  headline: null,
  callToAction: null,
  displayDomain: null,
  youtubeVideoId: null,
  mediaAspect: null,
};
