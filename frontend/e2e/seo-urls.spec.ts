import { test, expect, type Page } from "@playwright/test";

/**
 * SEO de las vistas de post (rediseño 2026-10-06): la ruta visible y los
 * antetítulos desaparecieron, pero cada detalle conserva para Google su
 * <title>, el canonical y el JSON-LD con BreadcrumbList. Corre contra el
 * stack real; toma el primer contenido de cada tipo desde Explorar.
 */
const TYPES = ["publicaciones", "lugares", "eventos", "galerias", "directorio"] as const;

async function firstDetailHref(page: Page, type: (typeof TYPES)[number]): Promise<string | null> {
  await page.goto(`/${type}`);
  return page.locator(`a[href^='/${type}/']`).first().getAttribute("href", { timeout: 5_000 }).catch(() => null);
}

for (const type of TYPES) {
  test(`detalle de ${type}: título, canonical y BreadcrumbList; sin patrones de diario`, async ({ page }) => {
    const href = await firstDetailHref(page, type);
    test.skip(!href, `no hay ${type} publicados en esta base`);

    await page.goto(href!);
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/${type}/`));

    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(jsonLd.some((block) => block.includes('"BreadcrumbList"'))).toBe(true);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toHaveCount(0);
    await expect(page.getByText(/min de lectura/)).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Acciones" })).toBeVisible();
  });
}
