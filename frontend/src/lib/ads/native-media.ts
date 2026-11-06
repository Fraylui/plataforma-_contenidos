import type { NativeMediaAspect } from "@/lib/api/types";

/** Mismos patrones que YouTubeUrlParser.java: el panel avisa antes de guardar lo que el servidor rechazaría. */
const YOUTUBE_PATTERNS = [
  /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
];

export function youtubeVideoId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = pattern.exec(url);
    if (match) return match[1];
  }
  return null;
}

/** Igual que CampaignService: un Short se muestra vertical (4:5 en el feed). */
export function videoAspect(url: string): NativeMediaAspect {
  return url.includes("/shorts/") ? "9:16" : "16:9";
}

/** Proporciones de feed de la foto (CampaignService.NATIVE_IMAGE_ASPECTS) y tolerancia de exportación. */
const PHOTO_ASPECTS: [NativeMediaAspect, number][] = [
  ["1:1", 1],
  ["4:5", 0.8],
  ["1.91:1", 1.91],
];
const TOLERANCE = 0.02;
export const NATIVE_PHOTO_MIN_WIDTH = 600;

export type PhotoFit =
  | { ok: true; aspect: NativeMediaAspect }
  | { ok: false; reason: "aspect" | "small" };

export function nativePhotoFit(width: number, height: number): PhotoFit {
  const actual = width / height;
  const match = PHOTO_ASPECTS.find(([, ratio]) => Math.abs(actual - ratio) / ratio <= TOLERANCE);
  if (!match) return { ok: false, reason: "aspect" };
  if (width < NATIVE_PHOTO_MIN_WIDTH) return { ok: false, reason: "small" };
  return { ok: true, aspect: match[0] };
}
