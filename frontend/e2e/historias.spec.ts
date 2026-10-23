import { test, expect, type APIRequestContext, type Page } from "@playwright/test";

/**
 * Historias de punta a punta (spec 2026-10-23): se crean por la API del panel,
 * aparecen primero en la fila del Inicio con el anillo «sin ver», el visor
 * avanza y se cierra, la píldora lleva al contenido y Atrás no reabre el visor.
 */
const API = process.env.E2E_API_URL ?? "http://localhost:8080";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";

test.skip(!ADMIN_PASSWORD, "Requiere E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD");

let token = "";
let created: string[] = [];
let topic = { id: "", name: "" };
let linked: { slug: string } | null = null;

async function ownerToken(request: APIRequestContext) {
  const res = await request.post(`${API}/api/v1/auth/login`, { data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  return (await res.json()).accessToken as string;
}

test.beforeAll(async ({ request }) => {
  token = await ownerToken(request);
  const categories = await (await request.get(`${API}/api/v1/categories`)).json();
  topic = { id: categories[0].id, name: categories[0].name };
  const publications = await (await request.get(`${API}/api/v1/publications?size=1`)).json();
  const publication = publications.items?.[0];
  linked = publication ? { slug: publication.slug } : null;
  const items = [
    { background: "OCEAN", caption: "Primera historia e2e", captionPosition: "CENTER", ...(publication ? { linkType: "PUBLICATION", linkId: publication.id } : {}) },
    { background: "SUNSET", caption: "Segunda historia e2e", captionPosition: "BOTTOM" },
  ];
  const res = await request.post(`${API}/api/v1/admin/stories`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { categoryId: topic.id, items },
  });
  expect(res.status()).toBe(201);
  created = (await res.json()).map((story: { id: string }) => story.id);
});

test.afterAll(async ({ request }) => {
  for (const id of created) {
    await request.delete(`${API}/api/v1/admin/stories/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  }
});

/** La fila del Inicio se cachea 30 s: se recarga hasta que aparece el tema con historias. */
async function openHomeWithStories(page: Page) {
  const ring = page.getByRole("link", { name: new RegExp(`Ver historias de ${topic.name}`) });
  await expect(async () => {
    await page.goto("/");
    await expect(ring).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 45_000, intervals: [3_000] });
  return ring;
}

test("el tema con historias va primero, se ve, avanza y se cierra", async ({ page }) => {
  test.setTimeout(90_000);
  const ring = await openHomeWithStories(page);
  const firstBubble = page.getByRole("navigation", { name: "Temas" }).getByRole("link").first();
  await expect(firstBubble).toHaveAccessibleName(new RegExp(`Ver historias de ${topic.name}`));

  await ring.click();
  const dialog = page.getByRole("dialog", { name: `Historias de ${topic.name}` });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/historia=/);
  await expect(dialog.getByText("Primera historia e2e")).toBeVisible();

  await page.keyboard.press("ArrowRight");
  await expect(dialog.getByText("Segunda historia e2e")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page).not.toHaveURL(/historia=/);
});

test("la píldora lleva al contenido y al volver el visor no se reabre", async ({ page }) => {
  test.skip(!linked, "La base no tiene publicaciones para enlazar");
  test.setTimeout(90_000);
  const ring = await openHomeWithStories(page);
  await ring.click();
  await page.getByRole("link", { name: /Ver publicación:/ }).click();
  await expect(page).toHaveURL(new RegExp(`/publicaciones/${linked!.slug}`));
  await page.goBack();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("un enlace a una historia que ya terminó lo dice y ofrece seguir", async ({ page }) => {
  await page.goto("/historias/00000000-0000-0000-0000-000000000000");
  await expect(page.getByRole("heading", { name: "Esta historia ya terminó" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ir al inicio" })).toBeVisible();
});

test("una historia compartida se abre directo en el visor", async ({ page }) => {
  await page.goto(`/historias/${created[0]}`);
  await expect(page.getByRole("dialog", { name: `Historias de ${topic.name}` })).toBeVisible();
  await expect(page.getByText("Primera historia e2e")).toBeVisible();
});
