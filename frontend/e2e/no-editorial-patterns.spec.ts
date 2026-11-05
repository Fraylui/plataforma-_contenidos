import { test, expect, type Page } from "@playwright/test";

/**
 * Guardia anti-diario (pedido del dueño: "esto NO es un editorial, es una
 * plataforma de contenido"): recorre las pantallas públicas y falla si
 * reaparece algo del diseño viejo — "min de lectura", la palabra
 * "editorial"/"artículo", "cubrimos", la ruta visible (Breadcrumb) o
 * antetítulos en mayúsculas. Corre contra el stack real.
 */
const SCREENS = ["/", "/explorar", "/buscar?q=a", "/publicaciones", "/lugares", "/celebraciones", "/galerias", "/contacto", "/privacidad", "/terminos"];
const DETAIL_TYPES = ["publicaciones", "lugares", "celebraciones", "galerias"];

/** Lenguaje de periódico o de redacción: no es un medio (CONTEXTO.md 1). */
const EDITORIAL_WORDS =
  /\beditorial\b|\bart[íi]culos?\b|\bcubrimos\b|\bnoticias?\b|\bperi[óo]dicos?\b|\bperiodismo\b|\bcr[óo]nicas?\b|\breportajes?\b|\bredacci[óo]n\b|\bredactor(es|a)?\b|\btitular(es)?\b|seguir leyendo|[úu]ltima hora/i;

async function assertNoEditorialPatterns(page: Page) {
  const main = page.locator("main");
  await expect(main.getByText(/min de lectura/i)).toHaveCount(0);
  await expect(main.getByText(EDITORIAL_WORDS)).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toHaveCount(0);
  // Antetítulos: texto visible transformado a mayúsculas por CSS. Excepciones: la etiqueta "Publicidad"
  // (pedida por Google/IAB) y lo que va dentro de un anuncio (el dominio del anuncio nativo, como en Facebook).
  const kickers = await main.locator(".uppercase:visible").evaluateAll((elements) =>
    elements
      .filter((el) => !el.closest('[data-testid="ad"], [aria-label^="Patrocinado"]'))
      .map((el) => el.textContent?.trim() ?? ""),
  );
  expect(kickers.filter((text) => text && text !== "Publicidad")).toEqual([]);
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

/*
 * El panel tampoco: crear tiene que sentirse como subir un post, no como
 * redactar una nota (dueño 2026-11). Solo las palabras; el panel sí usa
 * etiquetas en mayúsculas para ordenar secciones.
 */
test.describe("Panel sin lenguaje de redacción", () => {
  const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "";
  const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";
  test.skip(!ADMIN_PASSWORD, "Requiere E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD");

  const ADMIN_SCREENS = [
    "/admin", "/admin/calendario", "/admin/publicaciones", "/admin/publicaciones/nuevo",
    "/admin/lugares/nuevo", "/admin/celebraciones/nuevo", "/admin/galerias/nuevo", "/admin/guia",
  ];

  for (const path of ADMIN_SCREENS) {
    test(`${path} no habla como un periódico`, async ({ page }) => {
      await page.goto("/admin/login");
      await page.getByLabel("Correo electrónico").fill(ADMIN_EMAIL);
      await page.getByLabel("Contraseña", { exact: true }).fill(ADMIN_PASSWORD);
      await page.getByRole("button", { name: "Iniciar sesión" }).click();
      await expect(page).toHaveURL(/\/admin(?!\/login)/, { timeout: 10_000 });
      await page.goto(path);
      await expect(page.locator("main").getByText(EDITORIAL_WORDS)).toHaveCount(0);
    });
  }
});
