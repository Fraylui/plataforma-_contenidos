import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STORY_BACKGROUNDS, STORY_BACKGROUND_OPTIONS } from "./backgrounds";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/** Luminancia relativa WCAG de un color #rrggbb. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

describe("fondos de las historias de solo texto", () => {
  it("los cuatro fondos existen y usan un token de globals.css, no colores sueltos", () => {
    expect(Object.keys(STORY_BACKGROUNDS).sort()).toEqual(["FOREST", "NIGHT", "OCEAN", "SUNSET"]);
    for (const value of Object.values(STORY_BACKGROUNDS)) {
      const token = /^var\((--story-[a-z]+)\)$/.exec(value)?.[1];
      expect(token, value).toBeTruthy();
      expect(css).toContain(`${token}:`);
    }
    expect(STORY_BACKGROUND_OPTIONS.map((o) => o.value)).toEqual(["SUNSET", "OCEAN", "FOREST", "NIGHT"]);
  });

  it("el texto blanco grande cumple contraste 3:1 sobre cada color del degradado", () => {
    for (const value of Object.values(STORY_BACKGROUNDS)) {
      const token = /var\((--story-[a-z]+)\)/.exec(value)![1];
      const declaration = new RegExp(`${token}:([^;]+);`).exec(css)![1];
      for (const hex of declaration.match(/#[0-9a-f]{6}/gi) ?? []) {
        expect((1.05) / (luminance(hex) + 0.05), `${token} ${hex}`).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
