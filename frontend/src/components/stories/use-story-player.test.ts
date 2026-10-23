// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActiveTopic, StoryView } from "@/lib/api/types";
import { playableTopics, storyPlayerReducer, useStoryPlayer, type PlayerState } from "./use-story-player";

const hour = 3_600_000;

function story(id: string, expiresInMs = hour, highlighted = false): StoryView {
  return {
    id, imageId: null, background: "SUNSET", caption: id, captionPosition: "CENTER", link: null, youtubeVideoId: null,
    publishedAt: new Date(Date.now() - 1000).toISOString(), expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
    highlighted, likeCount: 0,
  };
}

function topic(id: string, ...stories: StoryView[]): ActiveTopic {
  return { category: { id, name: id, slug: id }, latestAt: new Date().toISOString(), stories };
}

const topics = [topic("t1", story("a"), story("b")), topic("t2", story("c"))];
const start: PlayerState = { topicIndex: 0, storyIndex: 0, paused: false, finished: false };

describe("storyPlayerReducer", () => {
  it("siguiente en la última historia pasa al tema siguiente", () => {
    expect(storyPlayerReducer({ ...start, storyIndex: 1 }, { type: "next" }, topics)).toMatchObject({ topicIndex: 1, storyIndex: 0 });
  });

  it("anterior en la primera va a la última del tema anterior", () => {
    expect(storyPlayerReducer({ ...start, topicIndex: 1 }, { type: "prev" }, topics)).toMatchObject({ topicIndex: 0, storyIndex: 1 });
  });

  it("anterior en la primera historia del primer tema se queda ahí", () => {
    expect(storyPlayerReducer(start, { type: "prev" }, topics)).toMatchObject({ topicIndex: 0, storyIndex: 0 });
  });

  it("siguiente en el último tema termina", () => {
    expect(storyPlayerReducer({ ...start, topicIndex: 1 }, { type: "next" }, topics).finished).toBe(true);
  });

  it("cambiar de tema empieza en su primera historia", () => {
    expect(storyPlayerReducer({ ...start, storyIndex: 1 }, { type: "nextTopic" }, topics)).toMatchObject({ topicIndex: 1, storyIndex: 0 });
    expect(storyPlayerReducer({ ...start, topicIndex: 1 }, { type: "prevTopic" }, topics)).toMatchObject({ topicIndex: 0, storyIndex: 0 });
  });

  it("pausa y sigue", () => {
    const paused = storyPlayerReducer(start, { type: "pause" }, topics);
    expect(paused.paused).toBe(true);
    expect(storyPlayerReducer(paused, { type: "resume" }, topics).paused).toBe(false);
  });
});

describe("playableTopics", () => {
  it("quita las caducadas (salvo Destacadas) y los temas que quedan vacíos", () => {
    const result = playableTopics(
      [topic("t1", story("vieja", -1000), story("ok")), topic("t2", story("se-fue", -1)), topic("t3", story("destacada", -1000, true))],
      new Date(),
    );
    expect(result.map((t) => t.category.id)).toEqual(["t1", "t3"]);
    expect(result[0].stories.map((s) => s.id)).toEqual(["ok"]);
  });
});

describe("useStoryPlayer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup(startTopicId = "t1") {
    const hook = renderHook(() => useStoryPlayer(topics, startTopicId));
    act(() => hook.result.current.setImageReady(true));
    return hook;
  }

  it("empieza en el tema pedido", () => {
    const { result } = setup("t2");
    expect(result.current.current?.id).toBe("c");
  });

  it("avanza a los 6 segundos", () => {
    const { result } = setup();
    act(() => vi.advanceTimersByTime(5_900));
    expect(result.current.current?.id).toBe("a");
    act(() => vi.advanceTimersByTime(200));
    expect(result.current.current?.id).toBe("b");
  });

  it("pausada no avanza", () => {
    const { result } = setup();
    act(() => result.current.dispatch({ type: "pause" }));
    act(() => vi.advanceTimersByTime(7_000));
    expect(result.current.current?.id).toBe("a");
  });

  it("no avanza hasta que la foto está lista", () => {
    const { result } = renderHook(() => useStoryPlayer(topics, "t1"));
    act(() => vi.advanceTimersByTime(7_000));
    expect(result.current.current?.id).toBe("a");
    expect(result.current.progress).toBe(0);
  });

  it("con la pestaña oculta se pausa", () => {
    const { result } = setup();
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    act(() => vi.advanceTimersByTime(7_000));
    expect(result.current.current?.id).toBe("a");
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    act(() => document.dispatchEvent(new Event("visibilitychange")));
  });

  it("al terminar todo, finished y sin historia actual", () => {
    const { result } = setup("t2");
    act(() => vi.advanceTimersByTime(6_100));
    expect(result.current.state.finished).toBe(true);
    expect(result.current.current).toBeNull();
  });
});
