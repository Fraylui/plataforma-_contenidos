import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function pages(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? pages(path) : name === "page.tsx" ? [path] : [];
  });
}

/**
 * Seguridad (OWASP A03, inyección): el JSON-LD se inserta con
 * dangerouslySetInnerHTML, así que todo "<" debe salir como el escape
 * literal BACKSLASH-u003c para que un título con "</script>" no pueda
 * cerrar la etiqueta. Un "BACKSLASH u003c" con una sola barra en el
 * código fuente es "<" en JavaScript y no escapa nada.
 */
describe("JSON-LD de las páginas", () => {
  const files = pages(dirname(fileURLToPath(import.meta.url))).filter((f) => readFileSync(f, "utf-8").includes("application/ld+json"));

  it("hay páginas con JSON-LD", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s escapa < en cada JSON-LD", (file) => {
    const source = readFileSync(file, "utf-8");
    const scripts = source.split("application/ld+json").length - 1;
    const escaped = source.split('.replace(/</g, "\\\\u003c")').length - 1;
    expect(escaped).toBeGreaterThanOrEqual(scripts);
  });
});
