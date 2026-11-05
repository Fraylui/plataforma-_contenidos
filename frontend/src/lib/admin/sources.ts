/** Mismas reglas que PostSources en el backend. */
export const MAX_SOURCES = 10;

export function isValidSourceUrl(value: string): boolean {
  const url = value.trim();
  if (!url || /\s/.test(url) || url.length > 2048) return false;
  try {
    const parsed = new URL(url);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && parsed.hostname.includes(".") && !parsed.username;
  } catch {
    return false;
  }
}

/** Las fuentes que se mandan: sin vacías ni repetidas. */
export function cleanSources(sources: string[]): string[] {
  return [...new Set(sources.map((s) => s.trim()).filter(Boolean))];
}

/** «promperu.gob.pe» para mostrar la fuente sin el enlace entero. */
export function sourceName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
