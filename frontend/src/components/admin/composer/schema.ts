import { z } from "zod";
import type { ContentVideoInput } from "@/lib/api/admin-types";
import type { ContentImage, ContentVideo } from "@/lib/api/types";

export const ROBOTS_OPTIONS = ["index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"];

export const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === "" || /^https?:\/\/\S+$/i.test(value), "Usa una dirección completa, que empiece con https://");

/** Texto visible de un HTML del editor, leído con el parser del navegador (no con expresiones regulares). */
function visibleText(html: string): string {
  return new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";
}

/** Texto del editor: obligatorio con contenido real, no solo etiquetas vacías. Se limpia en el backend (HtmlSanitizer). */
export const bodyField = z.string().refine((html) => visibleText(html).trim().length > 0, "Escribe el texto.");

export const videosField = z.array(z.custom<ContentVideoInput>());

/** Coordenada opcional escrita a mano o puesta por el mapa (texto, como el input). */
export function coordinateField(min: number, max: number, message: string) {
  return z
    .string()
    .trim()
    .refine((value) => value === "" || (!Number.isNaN(Number(value)) && Number(value) >= min && Number(value) <= max), message);
}

/**
 * Campos comunes a los 5 tipos de contenido. `title` es el título o el
 * nombre (Lugar y Directorio lo mandan como `name`); mismos límites que los
 * Request del backend (200 / 500).
 */
export const baseFields = {
  title: z.string().trim().min(1, "Escribe un título.").max(200, "Máximo 200 caracteres."),
  excerpt: z.string().max(500, "Máximo 500 caracteres."),
  categoryId: z.string().min(1, "Elige un tema."),
  seoTitle: z.string(),
  metaDescription: z.string(),
  canonicalUrl: optionalUrl,
  ogImageUrl: optionalUrl,
  robots: z.string(),
  images: z.array(z.custom<ContentImage>()),
};

export interface BaseComposerValues {
  title: string;
  excerpt: string;
  categoryId: string;
  seoTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogImageUrl: string;
  robots: string;
  images: ContentImage[];
}

interface BaseContent {
  excerpt: string | null;
  categoryId: string;
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  robots: string;
  images: ContentImage[];
}

/** Valores iniciales comunes desde lo guardado (o vacíos para algo nuevo). */
export function baseDefaults(title: string | undefined, content: BaseContent | undefined, firstCategoryId: string): BaseComposerValues {
  return {
    title: title ?? "",
    excerpt: content?.excerpt ?? "",
    categoryId: content?.categoryId ?? firstCategoryId,
    seoTitle: content?.seoTitle ?? "",
    metaDescription: content?.metaDescription ?? "",
    canonicalUrl: content?.canonicalUrl ?? "",
    ogImageUrl: content?.ogImageUrl ?? "",
    robots: content?.robots ?? "index,follow",
    images: content?.images ?? [],
  };
}

export function emptyToNull(value: string): string | null {
  return value.trim() || null;
}

export function coordinateOrNull(value: string): number | null {
  return value.trim() ? Number(value) : null;
}

/** Lo común que se manda al backend (sin título/nombre ni campos propios del tipo). */
export function baseInput(values: BaseComposerValues) {
  return {
    excerpt: emptyToNull(values.excerpt),
    categoryId: values.categoryId,
    seoTitle: emptyToNull(values.seoTitle),
    metaDescription: emptyToNull(values.metaDescription),
    canonicalUrl: emptyToNull(values.canonicalUrl),
    ogImageUrl: emptyToNull(values.ogImageUrl),
    robots: values.robots,
    images: values.images,
  };
}

export function videosFromContent(videos: ContentVideo[] | undefined): ContentVideoInput[] {
  return (videos ?? []).map((video) => ({
    url: `https://www.youtube.com/watch?v=${video.videoId}`,
    title: video.title,
    caption: video.caption,
  }));
}

/** ISO (UTC) → valor de un input datetime-local en la hora del navegador. */
export function toDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
