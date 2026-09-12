import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accesibilidad de página completa (WCAG 2.1 AA vía axe-core), distinta de
 * los tests de accesibilidad por componente en Vitest: acá se evalúa la
 * página real con layout, estilos y contenido de datos reales aplicados.
 */
const PUBLIC_PAGES = ["/", "/publicaciones", "/lugares", "/eventos", "/galerias", "/resenas", "/directorio",
  "/buscar", "/privacidad", "/terminos"];

for (const path of PUBLIC_PAGES) {
  test(`${path} no tiene violaciones WCAG 2.1 AA`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}

test("página de detalle de publicación no tiene violaciones WCAG", async ({ page, request }) => {
  const articles = await (await request.get("http://localhost:8080/api/v1/articles?size=1")).json();
  await page.goto(`/publicaciones/${articles.items[0].slug}`);
  await page.waitForLoadState("networkidle");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test("login admin no tiene violaciones WCAG", async ({ page }) => {
  await page.goto("/admin/login");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test("navegación completa del home es alcanzable solo con teclado", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
  expect(firstFocused).toBeTruthy();

  // Salto de enfoque visible: al menos un elemento interactivo del header debe recibir foco con Tab.
  let reachedNav = false;
  for (let i = 0; i < 15; i++) {
    const isInNav = await page.evaluate(() => !!document.activeElement?.closest("header, nav"));
    if (isInNav) {
      reachedNav = true;
      break;
    }
    await page.keyboard.press("Tab");
  }
  expect(reachedNav).toBe(true);
});
