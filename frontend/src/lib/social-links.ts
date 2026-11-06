/**
 * Redes oficiales de la plataforma (dueño 2026-10-21): solo enlaces, sin
 * APIs. Las mismas reglas que valida el backend (UpdatePlatformSettingsRequest).
 */
export type SocialKey = "youtube" | "instagram" | "tiktok" | "facebook" | "x" | "whatsapp";

export interface SocialNetwork {
  key: SocialKey;
  label: string;
  field: "youtubeUrl" | "instagramUrl" | "tiktokUrl" | "facebookUrl" | "xUrl" | "whatsappChannelUrl";
  pattern: RegExp;
  example: string;
}

/** En el orden en que se muestran (YouTube primero: ahí viven los videos y podcasts). */
export const SOCIAL_NETWORKS: SocialNetwork[] = [
  { key: "youtube", label: "YouTube", field: "youtubeUrl", pattern: /^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\/\S+$/, example: "https://youtube.com/@…" },
  { key: "instagram", label: "Instagram", field: "instagramUrl", pattern: /^https:\/\/(www\.)?instagram\.com\/\S+$/, example: "https://instagram.com/…" },
  { key: "tiktok", label: "TikTok", field: "tiktokUrl", pattern: /^https:\/\/(www\.)?tiktok\.com\/@\S+$/, example: "https://tiktok.com/@…" },
  { key: "facebook", label: "Facebook", field: "facebookUrl", pattern: /^https:\/\/(www\.|m\.)?(facebook\.com|fb\.com)\/\S+$/, example: "https://facebook.com/…" },
  { key: "x", label: "X", field: "xUrl", pattern: /^https:\/\/(www\.)?(x\.com|twitter\.com)\/\S+$/, example: "https://x.com/…" },
  {
    key: "whatsapp",
    label: "Canal de WhatsApp",
    field: "whatsappChannelUrl",
    pattern: /^https:\/\/(www\.)?whatsapp\.com\/channel\/[A-Za-z0-9]+\/?$/,
    example: "https://whatsapp.com/channel/…",
  },
];

type SocialFields = Record<SocialNetwork["field"], string | null>;

/** Las redes que tienen enlace, listas para pintar íconos. */
export function officialSocialLinks(settings: SocialFields): { key: SocialKey; label: string; url: string }[] {
  return SOCIAL_NETWORKS.flatMap((network) => {
    const url = settings[network.field]?.trim();
    return url ? [{ key: network.key, label: network.label, url }] : [];
  });
}

/** Mensaje si el enlace no es de esa red (vacío vale: no se muestra). */
export function socialLinkError(key: SocialKey, value: string): string | null {
  const network = SOCIAL_NETWORKS.find((n) => n.key === key)!;
  const url = value.trim();
  if (!url || network.pattern.test(url)) return null;
  return `Pega el enlace de ${network.label}: ${network.example}`;
}
