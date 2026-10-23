import { describe, expect, it } from "vitest";
import { updatedTimeFor } from "./post-header";

const published = { label: "hace 10 d", iso: "2026-10-01T12:00:00Z" };

describe("updatedTimeFor", () => {
  it("marca «actualizado» si se editó un día o más después de publicarse", () => {
    const time = updatedTimeFor(published, "2026-10-05T12:00:00Z");
    expect(time?.updated?.iso).toBe("2026-10-05T12:00:00Z");
  });

  it("un retoque el mismo día no cuenta", () => {
    expect(updatedTimeFor(published, "2026-10-01T20:00:00Z")?.updated).toBeUndefined();
  });

  it("sin fecha de publicación no inventa nada", () => {
    expect(updatedTimeFor(null, "2026-10-05T12:00:00Z")).toBeNull();
  });
});
