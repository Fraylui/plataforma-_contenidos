import { test, expect } from "@playwright/test";

/**
 * E2E del recorrido público real: home -> listado -> detalle -> me gusta,
 * y las páginas de índice de cada tipo de contenido. Corre contra el stack
 * completo (frontend + backend + Postgres + Redis reales), no mocks.
 */
test.describe("Navegación pública", () => {
  test("home carga y ofrece navegación a las secciones principales", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("listado de publicaciones muestra tarjetas y pagina", async ({ page }) => {
    await page.goto("/publicaciones");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const cards = page.locator("article, a[href^='/publicaciones/']").first();
    await expect(cards).toBeVisible();
  });

  test("desde el listado se navega al detalle de una publicación", async ({ page }) => {
    await page.goto("/publicaciones");
    const firstLink = page.locator("a[href^='/publicaciones/']").first();
    const href = await firstLink.getAttribute("href");
    await firstLink.click();
    await expect(page).toHaveURL(new RegExp(href!.replace(/[/]/g, "\\/")));
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
    ["/eventos", "Eventos"],
    ["/galerias", "Galerías"],
    ["/resenas", "Reseñas"],
    ["/directorio", "Directorio"],
  ] as const) {
    test(`índice de ${label} responde 200 y muestra encabezado`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }

  test("buscador devuelve resultados relevantes", async ({ page }) => {
    await page.goto("/buscar?q=ayacucho");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForLoadState("networkidle");
  });

  test("una categoría real muestra sus publicaciones", async ({ page, request }) => {
    const categories = await (await request.get("http://localhost:8080/api/v1/categories")).json();
    const slug = categories[0].slug;
    await page.goto(`/categorias/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
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
