import { test, expect, type Page } from "@playwright/test";

/**
 * E2E de autenticación admin contra el backend real (usuario bootstrap de
 * .env — ver README "Stack completo"). Cubre el guard de proxy.ts: sin
 * sesión, /admin/** redirige a login preservando el destino.
 */
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@dev.local";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";

async function fillLoginForm(page: Page): Promise<void> {
  await page.getByLabel("Correo electrónico").fill(ADMIN_EMAIL);
  await page.getByLabel("Contraseña").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
}

test.describe("Autenticación admin", () => {
  test("acceder a una ruta admin sin sesión redirige a login con el destino original", async ({ page }) => {
    await page.goto("/admin/publicaciones");
    await expect(page).toHaveURL(/\/admin\/login\?from=%2Fadmin%2Fpublicaciones/);
  });

  test("login con credenciales incorrectas muestra error y no redirige", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Correo electrónico").fill("no-existe@plataforma-contenidos.test");
    await page.getByLabel("Contraseña").fill("ContraseñaIncorrecta123!");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test.skip(!ADMIN_PASSWORD, "Requiere E2E_ADMIN_PASSWORD (o BOOTSTRAP_ADMIN_PASSWORD de .env) en el entorno");

  test("login válido entra al panel y la sesión persiste entre páginas", async ({ page }) => {
    await page.goto("/admin/login");
    await fillLoginForm(page);

    await expect(page).toHaveURL(/\/admin(?!\/login)/, { timeout: 10_000 });
    await page.goto("/admin/publicaciones");
    await expect(page).not.toHaveURL(/\/admin\/login/);
  });

  test("tras iniciar sesión, /admin/login redirige al destino solicitado originalmente", async ({ page }) => {
    await page.goto("/admin/eventos");
    await expect(page).toHaveURL(/from=%2Fadmin%2Feventos/);
    await fillLoginForm(page);
    await expect(page).toHaveURL(/\/admin\/eventos/, { timeout: 10_000 });
  });
});
