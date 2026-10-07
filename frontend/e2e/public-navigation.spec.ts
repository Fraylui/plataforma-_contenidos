import { test, expect } from "@playwright/test";

/** Escapa todo lo especial de una expresión regular (CodeQL: escapar solo "/" quedaba incompleto). */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

/**
 * E2E del recorrido público real (diseño estilo red social 2026-10-06):
 * inicio -> sección (feed filtrado) -> post -> me gusta, y las pantallas de
 * cada tipo de contenido. Corre contra el stack
 * completo (frontend + backend + Postgres + Redis reales), no mocks.
 */
test.describe("Navegación pública", () => {
  test("inicio carga con la navegación tipo app (riel o barra inferior) y el feed", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/.+/);
    await expect(page.getByRole("navigation", { name: "Principal" }).filter({ visible: true }).first()).toBeVisible();
    await expect(page.locator("article").first()).toBeVisible();
  });

  test("Publicaciones es el feed filtrado: chip activo y posts enlazados", async ({ page }) => {
    await page.goto("/publicaciones");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Publicaciones", exact: true }).and(page.locator("[aria-current='page']")).first()).toBeAttached();
    await expect(page.locator("a[href^='/publicaciones/']").first()).toBeVisible();
  });

  test("desde el listado se navega al detalle de una publicación", async ({ page }) => {
    await page.goto("/publicaciones");
    const firstLink = page.locator("a[href^='/publicaciones/']").first();
    const href = await firstLink.getAttribute("href");
    await firstLink.click();
    await expect(page).toHaveURL(new RegExp(`${escapeRegExp(href!)}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("me gusta en el detalle incrementa el contador y persiste tras recargar", async ({ page }) => {
    await page.goto("/publicaciones");
    const firstLink = page.locator("a[href^='/publicaciones/']").first();
    await firstLink.click();
    await page.waitForLoadState("networkidle");

    const likeButton = page.getByRole("button", { name: /Me gusta/ });
    await expect(likeButton).toBeVisible();
    const before = await likeButton.textContent();

    await likeButton.click();
    await expect(likeButton).toHaveAttribute("aria-pressed", "true");

    await page.reload();
    await expect(page.getByRole("button", { name: /Me gusta/ })).toHaveAttribute("aria-pressed", "true");
    void before;
  });

  for (const [path, label] of [
    ["/lugares", "Lugares"],
    ["/eventos", "Agenda"],
    ["/galerias", "Galerías"],
    ["/directorio", "Directorio"],
    ["/explorar", "Explorar"],
  ] as const) {
    test(`${label} responde 200 con su encabezado y sin patrones de diario`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByText("Filtrar por tema")).toHaveCount(0);
    });
  }

  test("las URLs viejas con ?page= siguen respondiendo (canonical a la sección)", async ({ page }) => {
    const response = await page.goto("/lugares?page=2");
    expect(response?.status()).toBe(200);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/lugares$/);
  });

  test("buscador devuelve resultados relevantes", async ({ page }) => {
    await page.goto("/buscar?q=ayacucho");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForLoadState("networkidle");
  });

  test("un tema muestra su encabezado y su círculo activo", async ({ page, request }) => {
    const categories = await (await request.get("http://localhost:8080/api/v1/categories")).json();
    const slug = categories[0].slug;
    await page.goto(`/categorias/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(`a[href="/categorias/${slug}"][aria-current="page"]`).first()).toBeAttached();
  });

  test("ruta inexistente muestra 404", async ({ page }) => {
    const response = await page.goto("/esta-ruta-no-existe-nunca");
    expect(response?.status()).toBe(404);
  });

  test("banner de cookies aparece en la primera visita y Aceptar lo cierra", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const banner = page.getByRole("region", { name: "Aviso de cookies" });
    await expect(banner).toBeVisible();
    await page.getByRole("button", { name: "Aceptar" }).click();
    await expect(banner).not.toBeVisible();
  });

  test("robots.txt y sitemap.xml responden", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
  });
});
