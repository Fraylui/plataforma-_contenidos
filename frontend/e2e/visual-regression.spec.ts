import { test, expect, type Page } from "@playwright/test";

/**
 * Regresión visual: captura comparada contra un baseline versionado
 * (e2e/*.spec.ts-snapshots/). La primera corrida genera el baseline
 * (`npm run test:e2e:update-snapshots`); las siguientes fallan si el diseño
 * cambió más de lo tolerado en playwright.config.ts (maxDiffPixelRatio).
 *
 * Solo pantallas estables: el feed cambia cada hora (orden con semilla
 * horaria), «Hoy se celebra» cada día y los anuncios rotan, así que
 * compararlo sería ruido; el feed lo cubren public-navigation y
 * accessibility. Los anuncios se tapan durante la captura.
 */
/** Anuncios (rotan): se tapan con un bloque fijo en la captura. */
const ADS = '[aria-label^="Patrocinado"], [data-testid="ad"], .fixed.z-40';

async function capture(page: Page, path: string, name: string) {
  await page.goto(path);
  // El aviso de cookies es fijo y taparía el contenido: se cierra antes de capturar.
  await page.getByRole("button", { name: "Rechazar" }).click({ timeout: 3_000 }).catch(() => {});
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot(name, { fullPage: true, animations: "disabled", mask: [page.locator(ADS)] });
}

for (const scheme of ["light", "dark"] as const) {
  test.describe(`Regresión visual — ${scheme === "light" ? "claro" : "oscuro"}`, () => {
    test.use({ colorScheme: scheme });

    test("login del panel", async ({ page }) => {
      await capture(page, "/admin/login", `admin-login-${scheme}.png`);
    });

    test("página de privacidad", async ({ page }) => {
      await capture(page, "/privacidad", `privacidad-${scheme}.png`);
    });

    test("página que no existe", async ({ page }) => {
      await capture(page, "/no-existe-esta-pagina", `404-${scheme}.png`);
    });
  });
}
