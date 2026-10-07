import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { serverImageUrl } = await import("./server-image-url");

afterEach(() => vi.unstubAllEnvs());

describe("serverImageUrl", () => {
  it("usa la URL interna de ejecución (la misma en build y runtime), no la del build", () => {
    // En el build de Docker BACKEND_API_URL es localhost (red del host) y queda escrita en el HTML prerenderizado;
    // en ejecución el optimizador de imágenes corre dentro del contenedor, donde solo existe backend:8080.
    vi.stubEnv("BACKEND_API_URL", "http://localhost:8080");
    vi.stubEnv("RUNTIME_BACKEND_INTERNAL_URL", "http://backend:8080");
    expect(serverImageUrl("/api/v1/images/x/file")).toBe("http://backend:8080/api/v1/images/x/file");
  });

  it("fuera de Docker usa BACKEND_API_URL", () => {
    vi.stubEnv("RUNTIME_BACKEND_INTERNAL_URL", "");
    vi.stubEnv("BACKEND_API_URL", "http://localhost:8080");
    expect(serverImageUrl("/a")).toBe("http://localhost:8080/a");
  });
});
