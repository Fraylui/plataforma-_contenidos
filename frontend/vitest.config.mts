import { defineConfig } from "vitest/config";

// Cobertura: solo lógica pura (permisos, árboles, formateo) — ver
// CONTEXTO.md sección 27, "Frontend: Component tests / Integration tests /
// E2E" es la fase siguiente, no cubierta acá todavía. Sin entorno jsdom a
// propósito: estos tests no tocan el DOM ni Server/Client Components.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
