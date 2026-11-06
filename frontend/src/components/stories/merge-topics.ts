import type { ActiveTopic, StoryView } from "@/lib/api/types";
import type { TopicStory } from "@/components/feed/topic-stories";

/** Una burbuja de la fila del Inicio: un tema, con sus historias activas si tiene. */
export type StoryTopic = TopicStory & { storyIds: string[] };

/**
 * La fila de temas con las historias encima (protección 1 de la spec): sin
 * historias queda igual que hoy. Con historias, esos temas van primero —en
 * el orden del servidor, del más reciente al más viejo— y un tema que solo
 * tiene historias también aparece, con la foto de su historia más nueva.
 * Lo decide el servidor: el cliente no reordena (sin saltos de diseño).
 */
export function mergeTopicsWithStories(
  topics: TopicStory[],
  active: ActiveTopic[],
  storyCover: (story: StoryView) => string | null,
): StoryTopic[] {
  const byId = new Map(topics.map((topic) => [topic.categoryId, topic]));
  const withStories: StoryTopic[] = active.map((entry) => {
    const known = byId.get(entry.category.id);
    const newest = entry.stories.at(-1);
    return {
      categoryId: entry.category.id,
      name: known?.name ?? entry.category.name,
      slug: known?.slug ?? entry.category.slug,
      coverUrl: known?.coverUrl ?? (newest ? storyCover(newest) : null),
      hasNew: known?.hasNew ?? false,
      storyIds: entry.stories.map((story) => story.id),
    };
  });
  const placed = new Set(withStories.map((topic) => topic.categoryId));
  return [...withStories, ...topics.filter((topic) => !placed.has(topic.categoryId)).map((topic) => ({ ...topic, storyIds: [] }))];
}
