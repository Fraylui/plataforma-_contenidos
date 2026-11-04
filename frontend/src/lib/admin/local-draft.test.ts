import { describe, expect, it } from "vitest";
import { readDraft, removeDraft, writeDraft } from "./local-draft";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe("local-draft", () => {
  it("guarda y recupera un borrador con su fecha", () => {
    const storage = memoryStorage();
    writeDraft(storage, "articulo:nuevo", { title: "Leyenda" }, new Date("2026-11-04T10:00:00Z"));
    expect(readDraft(storage, "articulo:nuevo")).toEqual({ savedAt: "2026-11-04T10:00:00.000Z", value: { title: "Leyenda" } });
  });

  it("borra el borrador", () => {
    const storage = memoryStorage();
    writeDraft(storage, "k", 1);
    removeDraft(storage, "k");
    expect(readDraft(storage, "k")).toBeNull();
  });

  it("ignora datos corruptos o un almacenamiento que falla", () => {
    const storage = memoryStorage();
    storage.setItem("panel-borrador:k", "{no es json");
    expect(readDraft(storage, "k")).toBeNull();
    const broken = {
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("lleno");
      },
      removeItem: () => {
        throw new Error("bloqueado");
      },
    };
    expect(readDraft(broken, "k")).toBeNull();
    expect(() => writeDraft(broken, "k", 1)).not.toThrow();
    expect(() => removeDraft(broken, "k")).not.toThrow();
    expect(readDraft(null, "k")).toBeNull();
  });
});
