import { SkeletonImage } from "@/components/ui/skeleton-image";
import { serverImageUrl } from "@/lib/server-image-url";
import { imageUrl } from "@/lib/image-url";
import { cn } from "@/lib/utils";
import type { ActiveCampaign } from "@/lib/api/types";

/**
 * Banner de una campaña de publicidad directa (ver CampaignPublicController)
 * — lo que AdBlock muestra en vez de AdSense cuando hay una vendida para esa
 * posición. El link pasa siempre por `/ads/campaigns/{id}/click` (backend):
 * nunca el `linkUrl` real, así el clic queda contado sin poder evitarse
 * copiando el href. Mismo criterio subida-vs-externa que ContentImageDisplay.
 *
 * `aspect-[3/1]` es el alto por defecto: a diferencia de AdSlot (que se
 * autodimensiona con el script de AdSense), acá la caja la define el CSS,
 * así que sin un alto explícito el <img> externo (sin next/image `fill`)
 * se renderiza a su tamaño intrínseco — de ahí que ningún caller de AdBlock
 * pasara className hasta ahora, nadie había vendido una campaña directa
 * todavía. Un className con su propio `aspect-*`/`h-*` lo reemplaza (twMerge).
 */
export function DirectCampaignBanner({ campaign, className }: { campaign: ActiveCampaign; className?: string }) {
  const clickHref = imageUrl(`/api/v1/ads/campaigns/${campaign.id}/click`);
  const alt = campaign.imageAlt ?? "Publicidad";

  return (
    <a
      href={clickHref}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={cn(
        "no-auto-ads relative block aspect-[3/1] max-h-64 w-full overflow-hidden rounded-2xl bg-canvas",
        className
      )}
    >
      {campaign.imageId ? (
        <SkeletonImage src={serverImageUrl(`/api/v1/images/${campaign.imageId}/file`)} alt={alt} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- host arbitrario, cargado por el anunciante
        <img src={campaign.externalImageUrl ?? ""} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
      )}
      {/* Autodisclosure liviano: tiene que quedar claro que es pauta paga sin taparle la imagen al anunciante. */}
      <span className="absolute top-1.5 left-1.5 rounded bg-black/30 px-1.5 py-[1px] text-[9px] font-medium tracking-wide text-white">
        Publicidad
      </span>
    </a>
  );
}
