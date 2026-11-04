import { describe, expect, it } from "vitest";
import { LAST_TOPIC_KEY, pickRememberedTopic, readLastTopic, rememberTopic } from "./last-topic";

function memoryStorage() {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
}

describe("last-topic", () => {
  it("recuerda y lee el último tema", () => {
    const storage = memoryStorage();
    rememberTopic("leyendas", storage);
    expect(readLastTopic(storage)).toBe("leyendas");
    expect(storage.getItem(LAST_TOPIC_KEY)).toBe("leyendas");
  });

  it("solo usa el tema recordado si sigue activo", () => {
    expect(pickRememberedTopic([{ id: "a" }, { id: "b" }], "b")).toBe("b");
    expect(pickRememberedTopic([{ id: "a" }], "borrado")).toBe("");
    expect(pickRememberedTopic([{ id: "a" }], "")).toBe("");
  });

  it("no falla sin almacenamiento", () => {
    const broken = {
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("lleno");
      },
    };
    expect(readLastTopic(broken)).toBe("");
    expect(() => rememberTopic("x", broken)).not.toThrow();
    expect(readLastTopic(null)).toBe("");
  });
});
