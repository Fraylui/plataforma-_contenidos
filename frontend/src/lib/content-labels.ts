import type { PublicationType, SearchResult, SearchResultType, PublicationStatus } from "@/lib/api/types";
import type { BadgeTone } from "@/components/ui";
import { SITE_TIME_ZONE } from "@/lib/site-time-zone";

const PUBLICATION_TYPE_LABELS: Record<PublicationType, string> = {
  GENERAL: "General",
  GUIA: "Guía",
  LISTA: "Lista",
  TUTORIAL: "Tutorial",
  HISTORIA: "Historia",
};

export function publicationTypeLabel(type: PublicationType): string {
  return PUBLICATION_TYPE_LABELS[type];
}

const PUBLICATION_STATUS_LABELS: Record<PublicationStatus, string> = {
  DRAFT: "Borrador",
  SCHEDULED: "Programado",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
};

export function publicationStatusLabel(status: PublicationStatus): string {
  return PUBLICATION_STATUS_LABELS[status];
}

// Color de la etiqueta de estado (Badge) — backend: shared.publishing.PublicationStatus.
const PUBLICATION_STATUS_TONE: Record<PublicationStatus, BadgeTone> = {
  DRAFT: "neutral",
  SCHEDULED: "warning",
  PUBLISHED: "success",
  ARCHIVED: "neutral",
};

export function publicationStatusTone(status: PublicationStatus): BadgeTone {
  return PUBLICATION_STATUS_TONE[status];
}

export function formatPublishedDate(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: SITE_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * Fecha de publicación de Publicación: tiempo relativo que se extiende
 * indefinidamente (segundos→minutos→horas→días→meses→años), nunca fecha
 * absoluta, nunca vacío — mismo patrón que usan YouTube/Reddit/GitHub, a
 * pedido explícito del usuario tras comparar con otros sitios grandes.
 * Solo para Publicación: es el único tipo de contenido donde "qué tan
 * reciente es" sigue siendo la señal relevante después de publicado (a
 * diferencia de Lugar/Galería, atemporales, o Celebración, donde la fecha es
 * de calendario, no de antigüedad — ver formatEventDateTime).
 */
export function formatPublicationDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return "justo ahora";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `hace ${diffDays} d`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `hace ${diffMonths} mes${diffMonths === 1 ? "" : "es"}`;
  const diffYears = Math.floor(diffMonths / 12);
  return `hace ${diffYears} año${diffYears === 1 ? "" : "s"}`;
}

/**
 * Fecha corta absoluta ("sáb 29 ago 2026") para Lugar/Galería en el
 * home: contenido atemporal donde "hace 3 meses" no aporta (ver
 * formatPublicationDate, que sí es relativa a propósito para Publicaciones).
 */
export function formatShortDate(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: SITE_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * Fecha y hora de un Celebración — siempre absoluta ("vie 12 dic, 7:00 p. m."),
 * nunca relativa ("hace 3 días", "en 5 horas"): a diferencia de la fecha de
 * publicación de Publicación/Lugar (un dato secundario de "qué tan viejo es
 * esto"), la fecha de un evento es información que el usuario necesita para
 * decidir si asiste — mismo criterio que usan Eventbrite/Meetup/Atlas
 * Obscura.
 */
export function formatEventDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: SITE_TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Una fecha única terminó cuando pasó endsAt (o startsAt); las que se repiten cada año nunca terminan. */
// Ver SearchResultResponse.java (CONTEXTO.md sección 16) — un solo lugar para
// la etiqueta y la ruta de cada tipo buscable (buscador con sugerencias en vivo).
const SEARCH_RESULT_TYPE_LABEL: Record<SearchResultType, string> = {
  PUBLICATION: "Publicación",
  PLACE: "Lugar",
  CELEBRATION: "Celebración",
  GALLERY: "Galería",
  EPISODE: "Episodio",
};

export function searchResultTypeLabel(type: SearchResultType): string {
  return SEARCH_RESULT_TYPE_LABEL[type];
}

const SEARCH_RESULT_TYPE_PATH: Record<SearchResultType, string> = {
  PUBLICATION: "publicaciones",
  PLACE: "lugares",
  CELEBRATION: "celebraciones",
  GALLERY: "galerias",
  EPISODE: "series",
};

/** Un episodio vive dentro de su serie: /series/{seriesSlug}/{slug}. */
export function searchResultHref(result: Pick<SearchResult, "contentType" | "slug" | "seriesSlug">): string {
  if (result.contentType === "EPISODE") return `/series/${result.seriesSlug}/${result.slug}`;
  return `/${SEARCH_RESULT_TYPE_PATH[result.contentType]}/${result.slug}`;
}

export function isCelebrationFinished(event: { startsAt: string; endsAt: string | null; recursYearly?: boolean; allDay?: boolean }): boolean {
  if (event.recursYearly) return false;
  // Todo el día: termina al acabar ese día, no a su medianoche de inicio.
  const reference = event.endsAt ?? (event.allDay ? new Date(new Date(event.startsAt).getTime() + 86_400_000).toISOString() : event.startsAt);
  return new Date(reference).getTime() < Date.now();
}
