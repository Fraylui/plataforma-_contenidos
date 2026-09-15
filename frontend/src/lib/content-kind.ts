// Sin "server-only": a diferencia de home-items.ts (que arma HomeItem desde
// los DTOs del backend, solo en Server Components), esto son mapas de
// etiquetas puras — los necesita tanto el home (servidor) como el feed de
// scroll infinito (Client Component, ver infinite-feed.tsx), que no puede
// importar home-items.ts sin arrastrar su "server-only".
import type { LikeableContentType } from "@/components/content/like-share-bar";

export type HomeItemKind = "publicacion" | "lugar" | "evento" | "galeria";

export const KIND_LABEL: Record<HomeItemKind, string> = {
  publicacion: "Publicación",
  lugar: "Lugar",
  evento: "Evento",
  galeria: "Galería",
};

const LIKE_TYPE: Record<HomeItemKind, LikeableContentType> = {
  publicacion: "articles",
  lugar: "places",
  evento: "events",
  galeria: "galleries",
};

/** Tipo de contenido para el endpoint de "me gusta" (ver like-share-bar.tsx). */
export function homeLikeType(kind: HomeItemKind): LikeableContentType {
  return LIKE_TYPE[kind];
}
