import { test, expect, type Page } from "@playwright/test";

/**
 * E2E de autenticación admin contra el backend real (usuario bootstrap de
 * .env — ver README "Stack completo"). Cubre el guard de proxy.ts: sin
 * sesión, /admin/** redirige a login preservando el destino.
 */
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@dev.local";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";

/**
 * Si la cuenta bootstrap ya tiene MFA activado (se configura desde el panel
 * — mfa-setup/), no hay forma segura de generar el código TOTP en un test
 * sin exponer el secreto en el repo. En ese caso, retorna true para que el
 * test se salte con test.skip() (forma sin argumentos, la única que aborta
 * de inmediato la ejecución de en medio de un test) en vez de fallar por un
 * motivo ajeno al guard que cubre. El flujo con MFA real lo prueba
 * identity/mfa/MfaFlowIntegrationTest.java en el backend.
 */
async function fillLoginForm(page: Page): Promise<boolean> {
  await page.getByLabel("Correo electrónico").fill(ADMIN_EMAIL);
  await page.getByLabel("Contraseña").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  return page
    .getByLabel(/Código de autenticación/)
    .waitFor({ state: "visible", timeout: 15000 })
    .then(() => true)
    .catch(() => false);
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
    const needsMfa = await fillLoginForm(page);
    if (needsMfa) {
      test.skip();
    }

    await expect(page).toHaveURL(/\/admin(?!\/login)/, { timeout: 10_000 });
    await page.goto("/admin/publicaciones");
    await expect(page).not.toHaveURL(/\/admin\/login/);
  });

  test("tras iniciar sesión, /admin/login redirige al destino solicitado originalmente", async ({ page }) => {
    await page.goto("/admin/eventos");
    await expect(page).toHaveURL(/from=%2Fadmin%2Feventos/);
    const needsMfa = await fillLoginForm(page);
    if (needsMfa) {
      test.skip();
    }
    await expect(page).toHaveURL(/\/admin\/eventos/, { timeout: 10_000 });
  });
});
