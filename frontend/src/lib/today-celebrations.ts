import "server-only";
import type { CelebrationSummary } from "@/lib/api/types";
import type { TodayCelebration } from "@/components/celebrations/today-celebrations";
import { formatCelebrationDate } from "@/lib/celebration-date";
import { serverImageUrl } from "@/lib/server-image-url";

/**
 * Forma de tarjeta de «Hoy se celebra», resuelta en el servidor: la URL de
 * imagen para next/image tiene que ser alcanzable desde Next (ver
 * server-image-url.ts) y la fecha se escribe en la zona del sitio. La usan
 * el render de la página y el proxy por visitante (api/celebrations/today).
 */
export function toTodayCelebration(date: CelebrationSummary): TodayCelebration {
  return {
    id: date.id,
    slug: date.slug,
    title: date.title,
    coverSrc: date.coverImageId ? serverImageUrl(`/api/v1/images/${date.coverImageId}/file`) : null,
    externalCoverUrl: date.coverImageUrl,
    dateLabel: formatCelebrationDate({
      at: date.nextOccurrenceAt,
      allDay: date.allDay,
      recursYearly: date.recursYearly,
      sinceYear: date.sinceYear,
    }),
  };
}
