import type { StoryLink, StoryLinkType } from "@/lib/api/types";

const PREFIX: Record<StoryLinkType, string> = {
  PUBLICATION: "/publicaciones",
  PLACE: "/lugares",
  CELEBRATION: "/celebraciones",
  GALLERY: "/galerias",
};

/** A dónde lleva el botón de una historia. */
export function storyLinkHref(link: StoryLink): string {
  return `${PREFIX[link.type]}/${link.slug}`;
}
