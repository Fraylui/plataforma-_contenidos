"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { TopicStory } from "@/components/feed/topic-stories";
import { TopicBubble } from "@/components/feed/topic-bubble";
import { allSeen, subscribe } from "./seen-stories";
import { useStoriesOpener } from "./stories-context";

/**
 * Burbuja de un tema con historias activas. Siempre es un enlace a su feed
 * (si el visor no cargó o el JavaScript falla, igual lleva al tema); con el
 * visor disponible, el toque lo abre en vez de navegar. El anillo pasa a
 * gris cuando este navegador ya vio todas (en el servidor: «sin ver»).
 */
export function StoryRing({ topic, storyIds, active = false }: { topic: TopicStory; storyIds: string[]; active?: boolean }) {
  const opener = useStoriesOpener();
  const seen = useSyncExternalStore(subscribe, () => allSeen(storyIds), () => false);

  return (
    <Link
      href={`/categorias/${topic.slug}`}
      aria-label={`Ver historias de ${topic.name}${seen ? "" : " (sin ver)"}`}
      aria-haspopup={opener ? "dialog" : undefined}
      aria-current={active ? "page" : undefined}
      onPointerEnter={opener?.prefetch}
      onFocus={opener?.prefetch}
      onClick={(event) => {
        if (!opener || event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        opener.open(topic.categoryId, event.currentTarget.getBoundingClientRect());
      }}
      className="group flex w-[4.5rem] flex-col items-center gap-1.5"
    >
      <span data-ring={seen ? "seen" : "unseen"} className="contents">
        <TopicBubble topic={topic} ring={seen ? "seen" : "stories"} active={active} />
      </span>
    </Link>
  );
}
