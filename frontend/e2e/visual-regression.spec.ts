import { test, expect } from "@playwright/test";

/**
 * Regresión visual: captura de pantalla completa comparada contra un
 * baseline versionado (e2e/*.spec.ts-snapshots/). La primera corrida
 * genera el baseline (`npx playwright test --update-snapshots`); las
 * siguientes fallan si el layout cambió más de lo tolerado en
 * playwright.config.ts (maxDiffPixelRatio).
 *
 * Se desactivan animaciones y se usa una URL con datos estables (o se
 * enmascaran los elementos que cambian por reloj/aleatoriedad) para que el
 * diff refleje cambios reales de diseño, no ruido.
 */
test.use({ colorScheme: "light" });

test.describe("Regresión visual — light", () => {
  test("home", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("home-light.png", { fullPage: true, animations: "disabled" });
  });

  test("listado de publicaciones", async ({ page }) => {
    await page.goto("/publicaciones");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("publicaciones-light.png", { fullPage: true, animations: "disabled" });
  });

  test("login admin", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page).toHaveScreenshot("admin-login-light.png", { fullPage: true, animations: "disabled" });
  });
});

test.describe("Regresión visual — dark", () => {
  test.use({ colorScheme: "dark" });

  test("home", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("home-dark.png", { fullPage: true, animations: "disabled" });
  });
});

test.describe("Regresión visual — mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("home en viewport móvil", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("home-mobile.png", { fullPage: true, animations: "disabled" });
  });
});
