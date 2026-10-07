import { test, expect, type Page } from "@playwright/test";

/**
 * Guardia anti-diario (pedido del dueño: "esto NO es un editorial, es una
 * plataforma de contenido"): recorre las pantallas públicas y falla si
 * reaparece algo del diseño viejo — "min de lectura", la palabra
 * "editorial"/"artículo", "cubrimos", la ruta visible (Breadcrumb) o
 * antetítulos en mayúsculas. Corre contra el stack real.
 */
const SCREENS = ["/", "/explorar", "/buscar?q=a", "/publicaciones", "/lugares", "/eventos", "/galerias", "/directorio", "/contacto", "/privacidad", "/terminos"];
const DETAIL_TYPES = ["publicaciones", "lugares", "eventos", "galerias", "directorio"];

async function assertNoEditorialPatterns(page: Page) {
  const main = page.locator("main");
  await expect(main.getByText(/min de lectura/i)).toHaveCount(0);
  await expect(main.getByText(/\beditorial\b|\bart[íi]culos?\b|\bcubrimos\b/i)).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toHaveCount(0);
  // Antetítulos: texto visible transformado a mayúsculas por CSS (la etiqueta "Publicidad" del banner es la excepción pedida por Google/IAB).
  const kickers = await main.locator(".uppercase:visible").allTextContents();
  expect(kickers.filter((text) => text.trim() && text.trim() !== "Publicidad")).toEqual([]);
}

for (const path of SCREENS) {
  test(`${path} no tiene patrones de diario`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await assertNoEditorialPatterns(page);
  });
}

for (const type of DETAIL_TYPES) {
  test(`detalle de ${type} no tiene patrones de diario`, async ({ page }) => {
    await page.goto(`/${type}`);
    const href = await page.locator(`a[href^='/${type}/']`).first().getAttribute("href", { timeout: 5_000 }).catch(() => null);
    test.skip(!href, `no hay ${type} publicados en esta base`);
    await page.goto(href!);
    await assertNoEditorialPatterns(page);
  });
}
