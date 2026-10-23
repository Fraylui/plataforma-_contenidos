import { describe, expect, it } from "vitest";
import { storyTimeLabel } from "./story-time";

const now = new Date("2026-10-23T12:00:00Z");
const base = { highlighted: false, publishedAt: "2026-10-23T07:00:00Z" };

describe("storyTimeLabel", () => {
  it("activa: cuánto le queda", () => {
    expect(storyTimeLabel({ ...base, expiresAt: "2026-10-23T17:00:00Z" }, now)).toBe("quedan 5 h");
    expect(storyTimeLabel({ ...base, expiresAt: "2026-10-23T12:40:00Z" }, now)).toBe("quedan 40 min");
  });

  it("terminada: hace cuánto", () => {
    expect(storyTimeLabel({ ...base, expiresAt: "2026-10-21T12:00:00Z" }, now)).toBe("terminó hace 2 d");
    expect(storyTimeLabel({ ...base, expiresAt: "2026-10-23T09:00:00Z" }, now)).toBe("terminó hace 3 h");
  });

  it("Destacada: no caduca", () => {
    expect(storyTimeLabel({ ...base, highlighted: true, expiresAt: "2026-10-21T12:00:00Z" }, now)).toBe("Destacada");
  });
});
