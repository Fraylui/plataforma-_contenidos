import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Guardia de lenguaje (pedido del dueño, 2026-10-06: "esto no es un
 * editorial ni periodismo, es una plataforma de contenido"): ningún texto
 * visible del sitio ni del panel usa vocabulario de redacción. Revisa el
 * código fuente de app/ y components/ sin comentarios; los identificadores
 * internos no cuentan (solo texto entre comillas o entre etiquetas JSX).
 */
const FORBIDDEN =
  /\b(editorial(es)?|redacci[oó]n|redactor(es|a)?|periodis(mo|tas?)|noticias?|reportajes?|cr[oó]nicas?|art[ií]culos?|cubrimos|min de lectura|monetizaci[oó]n|antet[ií]tulos?|entradillas?)\b/i;

const src = join(dirname(fileURLToPath(import.meta.url)), "..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

function visibleTexts(source: string): string[] {
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
  const quoted = [...code.matchAll(/"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`/g)].map((m) => m[1] ?? m[2] ?? m[3] ?? "");
  const jsxText = [...code.matchAll(/>([^<>{}]+)</g)].map((m) => m[1]);
  // Rutas e imports no son texto visible (p. ej. "@/components/article/...").
  return [...quoted, ...jsxText].filter((text) => !/^[@./]/.test(text.trim()));
}

describe("lenguaje de plataforma de contenido", () => {
  const files = [...sourceFiles(join(src, "app")), ...sourceFiles(join(src, "components"))];

  it("revisa los archivos del sitio y del panel", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("ningún texto visible usa vocabulario de redacción", () => {
    const offenders = files.flatMap((file) =>
      visibleTexts(readFileSync(file, "utf-8"))
        .filter((text) => FORBIDDEN.test(text))
        .map((text) => `${relative(src, file)}: «${text.trim()}»`),
    );
    expect(offenders).toEqual([]);
  });
});
