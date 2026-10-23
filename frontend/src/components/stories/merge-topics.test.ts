import { describe, expect, it } from "vitest";
import type { ActiveTopic, StoryView } from "@/lib/api/types";
import type { TopicStory } from "@/components/feed/topic-stories";
import { mergeTopicsWithStories } from "./merge-topics";

const topic = (id: string): TopicStory => ({ categoryId: id, name: id, slug: id, coverUrl: `/c/${id}.jpg`, hasNew: false });
const story = (id: string, imageId: string | null = null): StoryView => ({
  id, imageId, background: imageId ? null : "OCEAN", caption: id, captionPosition: "BOTTOM", link: null, youtubeVideoId: null,
  publishedAt: "2026-10-23T10:00:00Z", expiresAt: "2026-10-24T10:00:00Z", highlighted: false, likeCount: 0,
});
const active = (id: string, latestAt: string, ...stories: StoryView[]): ActiveTopic => ({
  category: { id, name: `Tema ${id}`, slug: `tema-${id}` }, latestAt, stories,
});
const cover = (s: StoryView) => (s.imageId ? `/img/${s.imageId}` : null);

describe("mergeTopicsWithStories", () => {
  it("sin historias, la fila queda igual que hoy", () => {
    const topics = [topic("a"), topic("b")];
    expect(mergeTopicsWithStories(topics, [], cover)).toEqual(topics.map((t) => ({ ...t, storyIds: [] })));
  });

  it("los temas con historias van primero, del más reciente al más viejo; el resto mantiene su orden", () => {
    const result = mergeTopicsWithStories(
      [topic("a"), topic("b"), topic("c")],
      [active("c", "2026-10-23T12:00:00Z", story("c1")), active("a", "2026-10-23T09:00:00Z", story("a1"), story("a2"))],
      cover,
    );
    expect(result.map((t) => t.categoryId)).toEqual(["c", "a", "b"]);
    expect(result[1].storyIds).toEqual(["a1", "a2"]);
    expect(result[2].storyIds).toEqual([]);
  });

  it("un tema que solo tiene historias también aparece, con la foto de su historia más nueva", () => {
    const result = mergeTopicsWithStories([topic("a")], [active("x", "2026-10-23T12:00:00Z", story("x1", "i1"), story("x2", "i2"))], cover);
    expect(result[0]).toMatchObject({ categoryId: "x", name: "Tema x", slug: "tema-x", coverUrl: "/img/i2", storyIds: ["x1", "x2"] });
    expect(result.map((t) => t.categoryId)).toEqual(["x", "a"]);
  });
});
