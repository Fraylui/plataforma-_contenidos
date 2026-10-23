import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accesibilidad de página completa (WCAG 2.2 AA vía axe-core), distinta de
 * los tests por componente en Vitest: acá se evalúa la página real con
 * layout, estilos y datos. Cubre cada pantalla del sitio y del panel.
 */
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const API = process.env.E2E_API_URL ?? "http://localhost:8080";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";

async function expectNoViolations(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  const results = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  expect(results.violations, `${path}\n${JSON.stringify(results.violations, null, 2)}`).toEqual([]);
}

const PUBLIC_PAGES = [
  "/", "/explorar", "/buscar?q=ayacucho", "/publicaciones", "/lugares", "/celebraciones", "/galerias",
  "/series", "/en-vivo", "/contacto", "/privacidad", "/terminos", "/no-existe-esta-pagina",
];

for (const path of PUBLIC_PAGES) {
  test(`${path} cumple WCAG 2.2 AA`, async ({ page }) => {
    await expectNoViolations(page, path);
  });
}

/** El primer contenido publicado de cada tipo (si la base no tiene, se omite). */
const DETAILS: [string, string, string][] = [
  ["publicación", "publications", "publicaciones"],
  ["lugar", "places", "lugares"],
  ["celebración", "celebrations", "celebraciones"],
  ["galería", "galleries", "galerias"],
];

for (const [label, api, route] of DETAILS) {
  test(`detalle de ${label} cumple WCAG 2.2 AA`, async ({ page, request }) => {
    const page0 = await (await request.get(`${API}/api/v1/${api}?size=1`)).json();
    test.skip(!page0.items?.length, `no hay ${label} publicada en esta base`);
    await expectNoViolations(page, `/${route}/${page0.items[0].slug}`);
  });
}

test("un tema cumple WCAG 2.2 AA", async ({ page, request }) => {
  const categories = await (await request.get(`${API}/api/v1/categories`)).json();
  const first = Array.isArray(categories) ? categories[0] : categories.items?.[0];
  test.skip(!first, "no hay temas en esta base");
  await expectNoViolations(page, `/categorias/${first.slug}`);
});

test("login del panel cumple WCAG 2.2 AA", async ({ page }) => {
  await expectNoViolations(page, "/admin/login");
});

test.describe("Panel con sesión", () => {
  test.skip(!ADMIN_PASSWORD, "Requiere E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD");

  const ADMIN_PAGES = [
    "/admin", "/admin/estadisticas", "/admin/historias", "/admin/historias/nueva", "/admin/publicaciones",
    "/admin/publicaciones/nuevo", "/admin/lugares",
    "/admin/celebraciones", "/admin/celebraciones/nuevo", "/admin/galerias", "/admin/series",
    "/admin/temas", "/admin/imagenes", "/admin/anunciantes", "/admin/espacios", "/admin/trabajadores",
    "/admin/configuracion", "/admin/cuenta",
  ];

  for (const path of ADMIN_PAGES) {
    test(`${path} cumple WCAG 2.2 AA`, async ({ page }) => {
      await page.goto("/admin/login");
      await page.getByLabel("Correo electrónico").fill(ADMIN_EMAIL);
      await page.getByLabel("Contraseña", { exact: true }).fill(ADMIN_PASSWORD);
      await page.getByRole("button", { name: "Iniciar sesión" }).click();
      await expect(page).toHaveURL(/\/admin(?!\/login)/, { timeout: 10_000 });
      await expectNoViolations(page, path);
    });
  }
});

test("navegación completa del home es alcanzable solo con teclado", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
  expect(firstFocused).toBeTruthy();

  // Salto de enfoque visible: al menos un elemento interactivo de la navegación debe recibir foco con Tab.
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
