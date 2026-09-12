import { defineConfig, devices } from "@playwright/test";

/**
 * E2E + regresión visual + accesibilidad de página completa (CONTEXTO.md
 * sección 27, fase "siguiente" que quedaba pendiente). Corre contra el
 * stack real levantado con `docker compose` (o `npm run dev` / `mvnw
 * spring-boot:run` en desarrollo) — no arranca servidores por sí mismo,
 * porque el frontend necesita al backend real arriba (Server Components
 * hacen fetch en build/request time).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 30_000,
  expect: {
    timeout: 5_000,
    // Regresión visual: 0.2% de píxeles distintos tolerados (antialiasing
    // entre corridas), más allá de eso es un cambio visual real.
    toHaveScreenshot: { maxDiffPixelRatio: 0.002 },
  },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
  ],
});
