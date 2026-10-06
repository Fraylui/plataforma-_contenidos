import { describe, expect, it } from "vitest";
import { isSearchShortcut, type ShortcutKeyEvent } from "./search-shortcut";

function key(init: Partial<ShortcutKeyEvent>): ShortcutKeyEvent {
  return {
    key: "",
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    isComposing: false,
    target: { tagName: "BODY", isContentEditable: false },
    ...init,
  };
}

const input = { tagName: "INPUT", isContentEditable: false };

describe("isSearchShortcut", () => {
  it("acepta Ctrl+K y ⌘+K (mayúscula o minúscula)", () => {
    expect(isSearchShortcut(key({ key: "k", ctrlKey: true }))).toBe(true);
    expect(isSearchShortcut(key({ key: "K", metaKey: true }))).toBe(true);
  });

  it("Ctrl+K funciona aunque el foco esté en otro campo", () => {
    expect(isSearchShortcut(key({ key: "k", ctrlKey: true, target: input }))).toBe(true);
  });

  it("no acepta K sola ni con Alt/Shift extra", () => {
    expect(isSearchShortcut(key({ key: "k" }))).toBe(false);
    expect(isSearchShortcut(key({ key: "k", ctrlKey: true, altKey: true }))).toBe(false);
    expect(isSearchShortcut(key({ key: "k", ctrlKey: true, shiftKey: true }))).toBe(false);
  });

  it('acepta "/" fuera de campos de texto', () => {
    expect(isSearchShortcut(key({ key: "/" }))).toBe(true);
    expect(isSearchShortcut(key({ key: "/", target: null }))).toBe(true);
  });

  it('ignora "/" mientras se escribe en input, textarea, select o contenido editable', () => {
    for (const target of [
      input,
      { tagName: "TEXTAREA", isContentEditable: false },
      { tagName: "SELECT", isContentEditable: false },
      { tagName: "DIV", isContentEditable: true },
    ]) {
      expect(isSearchShortcut(key({ key: "/", target }))).toBe(false);
    }
  });

  it('ignora "/" con modificadores y durante composición (IME)', () => {
    expect(isSearchShortcut(key({ key: "/", ctrlKey: true }))).toBe(false);
    expect(isSearchShortcut(key({ key: "/", isComposing: true }))).toBe(false);
  });
});
