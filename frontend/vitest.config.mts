import { defineConfig } from "vitest/config";

// Dos proyectos con entornos distintos (CONTEXTO.md sección 27):
//  - unit: lógica pura (permisos, árboles, formateo) en Node, sin DOM. Son
//    los *.test.ts.
//  - components: Client Components renderizados con Testing Library sobre
//    jsdom (unitarios de componente + integración de componente con sus
//    dependencias mockeadas: server actions, fetch, next/navigation). Son
//    los *.test.tsx. Incluyen chequeo de accesibilidad con axe.
// E2E, regresión visual, accesibilidad de página y performance viven en
// Playwright / Lighthouse (ver e2e/ y playwright.config.ts), no acá.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "components",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./src/test/setup.ts"],
        },
      },
    ],
  },
});
