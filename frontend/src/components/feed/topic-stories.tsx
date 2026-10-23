import Link from "next/link";
import { StoryRing } from "@/components/stories/story-ring";
import { ScrollRow } from "./scroll-row";
import { TopicBubble } from "./topic-bubble";

export interface TopicStory {
  categoryId: string;
  name: string;
  slug: string;
  /** Portada ya resuelta (imagen del contenido más reciente del tema), o null. */
  coverUrl: string | null;
  /** Algo publicado en las últimas 48 h: anillo de color, como una historia sin ver. */
  hasNew: boolean;
  /** Historias activas del tema, en orden de reproducción (vacío = burbuja de tema como siempre). */
  storyIds?: string[];
}

/**
 * Fila de círculos de temas arriba del feed (lo más reconocible de
 * Instagram). Un tema con historias activas abre el visor (y va primero);
 * los demás abren su feed filtrado, con el anillo de color si tienen
 * novedades. Deslizable con el dedo.
 */
export function TopicStories({
  topics,
  activeCategoryId,
}: {
  topics: TopicStory[];
  activeCategoryId?: string;
}) {
  if (topics.length === 0) return null;
  return (
    <nav aria-label="Temas">
      <ScrollRow label="Temas">
        <ul className="flex w-max gap-4 py-2">
          {topics.map((topic) => {
            const active = topic.categoryId === activeCategoryId;
            return (
              <li key={topic.categoryId}>
                {topic.storyIds && topic.storyIds.length > 0 ? (
                  <StoryRing topic={topic} storyIds={topic.storyIds} active={active} />
                ) : (
                  <Link
                    href={`/categorias/${topic.slug}`}
                    aria-current={active ? "page" : undefined}
                    data-ring="none"
                    className="group flex w-[4.5rem] flex-col items-center gap-1.5"
                  >
                    <TopicBubble topic={topic} ring={topic.hasNew ? "new" : "none"} active={active} />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </ScrollRow>
    </nav>
  );
}
