import { describe, expect, it } from "vitest";
import { isNearSquare } from "./logo";

describe("isNearSquare (logo del anunciante)", () => {
  it("ofrece cuadradas y casi cuadradas, no banners", () => {
    expect(isNearSquare({ width: 400, height: 400 })).toBe(true);
    expect(isNearSquare({ width: 1080, height: 1350 })).toBe(true);
    expect(isNearSquare({ width: 1200, height: 400 })).toBe(false);
    expect(isNearSquare({ width: 728, height: 90 })).toBe(false);
  });

  it("sin medida no se puede saber: se ofrece", () => {
    expect(isNearSquare({ width: 0, height: 0 })).toBe(true);
  });
});
