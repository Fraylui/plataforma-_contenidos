import { SkeletonImage } from "@/components/ui/skeleton-image";
import { serverImageUrl } from "@/lib/server-image-url";
import { imageUrl } from "@/lib/image-url";
import type { ActiveCampaign } from "@/lib/api/types";

/**
 * Banner de una campaña de publicidad directa (ver CampaignPublicController)
 * — lo que AdBlock muestra en vez de AdSense cuando hay una vendida para esa
 * posición. El link pasa siempre por `/ads/campaigns/{id}/click` (backend):
 * nunca el `linkUrl` real, así el clic queda contado sin poder evitarse
 * copiando el href. Mismo criterio subida-vs-externa que ContentImageDisplay.
 */
export function DirectCampaignBanner({ campaign, className }: { campaign: ActiveCampaign; className?: string }) {
  const clickHref = imageUrl(`/api/v1/ads/campaigns/${campaign.id}/click`);
  const alt = campaign.imageAlt ?? "Publicidad";

  return (
    <a
      href={clickHref}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`relative block overflow-hidden${className ? ` ${className}` : ""}`}
    >
      {campaign.imageId ? (
        <SkeletonImage src={serverImageUrl(`/api/v1/images/${campaign.imageId}/file`)} alt={alt} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- host arbitrario, cargado por el anunciante
        <img src={campaign.externalImageUrl ?? ""} alt={alt} className="h-full w-full object-cover" />
      )}
    </a>
  );
}
