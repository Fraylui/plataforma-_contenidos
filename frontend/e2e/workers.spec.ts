import { test, expect, type Page } from "@playwright/test";

/**
 * Flujo completo de trabajadores (spec 2a): el dueño crea un trabajador con
 * la plantilla «Gestor de eventos», el trabajador entra con la contraseña
 * temporal, debe elegir una propia, ve solo sus módulos, no puede entrar a
 * Trabajadores, y al desactivarlo pierde el acceso al instante. Corre
 * contra el stack real; al terminar el trabajador queda desactivado.
 */
const OWNER_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@dev.local";
const OWNER_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";

async function login(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/admin(?!\/login)/, { timeout: 10_000 });
}

test.describe.configure({ mode: "serial" });
test.skip(!OWNER_PASSWORD, "Requiere E2E_ADMIN_PASSWORD (o BOOTSTRAP_ADMIN_PASSWORD de .env)");

test("el dueño crea un trabajador y este solo ve sus módulos", async ({ browser }) => {
  const email = `e2e-trabajador-${Date.now()}@plataforma-contenidos.test`;
  const owner = await browser.newPage();
  await login(owner, OWNER_EMAIL, OWNER_PASSWORD);

  await owner.goto("/admin/trabajadores/nuevo");
  await owner.getByLabel("Nombre").fill("Prueba");
  await owner.getByLabel("Apellido").fill("Automática");
  await owner.getByLabel("Correo").fill(email);
  await owner.getByRole("button", { name: "Gestor de eventos" }).click();
  await owner.getByRole("button", { name: "Crear trabajador" }).click();

  const dialog = owner.getByRole("dialog", { name: /Contraseña temporal de Prueba Automática/ });
  await expect(dialog).toBeVisible();
  const temporary = (await dialog.locator("code").textContent())!.trim();
  expect(temporary).toMatch(/^[A-Za-z0-9]{20}$/);
  await dialog.getByRole("button", { name: "Listo" }).click();
  await expect(owner).toHaveURL(/\/admin\/trabajadores\/[0-9a-f-]{36}/);
  const workerUrl = owner.url();

  // El trabajador entra con la temporal y solo puede cambiarla.
  const workerContext = await browser.newContext();
  const worker = await workerContext.newPage();
  await login(worker, email, temporary);
  await expect(worker.getByText("Antes de empezar, elige tu contraseña.")).toBeVisible();
  await worker.getByLabel("Contraseña actual").fill(temporary);
  await worker.getByLabel("Contraseña nueva").fill("ClaveDePrueba2026!");
  await worker.getByLabel("Repite la contraseña nueva").fill("ClaveDePrueba2026!");
  await worker.getByRole("button", { name: "Cambiar contraseña" }).click();

  const menu = worker.getByRole("navigation", { name: "Menú del panel" });
  await expect(menu).toBeVisible({ timeout: 10_000 });
  await expect(menu.getByRole("link")).toHaveText(["Inicio", "Lugares", "Eventos", "Imágenes", "Mi cuenta"]);

  await worker.goto("/admin/trabajadores");
  await expect(worker.getByText("No tienes acceso a esta sección")).toBeVisible();

  // El dueño lo desactiva: la siguiente acción del trabajador lo saca al login.
  await owner.goto(workerUrl);
  await owner.getByRole("button", { name: "Desactivar" }).click();
  await owner.getByRole("alertdialog").getByRole("button", { name: "Desactivar" }).click();
  await expect(owner.getByText("Trabajador desactivado")).toBeVisible();

  await worker.goto("/admin/eventos");
  await expect(worker).toHaveURL(/\/admin\/login/, { timeout: 10_000 });
});
