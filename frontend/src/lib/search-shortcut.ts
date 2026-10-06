/**
 * Atajo de teclado para ir al buscador (CONTEXTO §45.2-C): Ctrl+K / ⌘+K
 * (convención de GitHub, Vercel, Notion…) y "/" (YouTube, GitHub, MDN).
 *
 * Ctrl+K vale siempre — nadie lo escribe como texto. "/" solo fuera de
 * campos de texto, para no robar la barra mientras alguien escribe una URL o
 * una fecha en un formulario. Sin dependencias del DOM para testearla en node.
 */
export interface ShortcutKeyEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  isComposing: boolean;
  target: { tagName?: string; isContentEditable?: boolean } | null;
}

const TEXT_ENTRY_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function isSearchShortcut(e: ShortcutKeyEvent): boolean {
  if (e.isComposing || e.altKey || e.shiftKey) return false;

  if (e.key.toLowerCase() === "k") return e.ctrlKey || e.metaKey;

  if (e.key === "/") {
    if (e.ctrlKey || e.metaKey) return false;
    const target = e.target;
    return !(target && (target.isContentEditable || TEXT_ENTRY_TAGS.has(target.tagName ?? "")));
  }

  return false;
}
