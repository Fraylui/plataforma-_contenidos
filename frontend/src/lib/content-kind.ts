// Sin "server-only": a diferencia de home-items.ts (que arma HomeItem desde
// los DTOs del backend, solo en Server Components), esto son mapas de
// etiquetas puras — los necesita tanto el home (servidor) como el feed de
// scroll infinito (Client Component, ver feed/feed.tsx), que no puede
// importar home-items.ts sin arrastrar su "server-only".
import type { LikeableContentType } from "@/components/content/like-share-bar";

export type HomeItemKind = "publicacion" | "lugar" | "celebracion" | "galeria" | "episodio";

export const KIND_LABEL: Record<HomeItemKind, string> = {
  publicacion: "Publicación",
  lugar: "Lugar",
  celebracion: "Celebración",
  galeria: "Galería",
  episodio: "Episodio",
};

const LIKE_TYPE: Record<HomeItemKind, LikeableContentType> = {
  publicacion: "publications",
  lugar: "places",
  celebracion: "celebrations",
  galeria: "galleries",
  episodio: "episodes",
};

/** Tipo de contenido para el endpoint de "me gusta" (ver like-share-bar.tsx). */
export function homeLikeType(kind: HomeItemKind): LikeableContentType {
  return LIKE_TYPE[kind];
}
