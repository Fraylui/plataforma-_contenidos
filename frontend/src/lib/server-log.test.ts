import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { BackendError, logError, orNull } = await import("./server-log");
const { NotFoundError } = await import("./api/errors");

afterEach(() => vi.restoreAllMocks());

function lastLine(spy: ReturnType<typeof vi.spyOn>): Record<string, unknown> {
  return JSON.parse(String(spy.mock.calls.at(-1)?.[0]));
}

describe("server-log", () => {
  it("una línea JSON por error, con dónde pasó y el id de la petición del backend", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logError("publicacion.categoria", new BackendError("Error del backend (500) en /api/v1/categories/x", 500, "req-123"));
    const line = lastLine(spy);
    expect(line).toMatchObject({ level: "error", service: "frontend", scope: "publicacion.categoria", status: 500, requestId: "req-123" });
    expect(line.message).toMatch(/500/);
    expect(typeof line.time).toBe("string");
  });

  it("orNull deja rastro y devuelve null para que la página siga", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(Promise.reject(new Error("caído")).catch(orNull("en-vivo.ahora"))).resolves.toBeNull();
    expect(lastLine(spy)).toMatchObject({ scope: "en-vivo.ahora", message: "caído" });
  });

  it("«no encontrado» es esperable: no ensucia el registro", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(Promise.reject(new NotFoundError("No encontrado")).catch(orNull("x"))).resolves.toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });
});
