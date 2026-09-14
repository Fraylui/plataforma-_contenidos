import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { loginAction } from "./actions";
import { LoginForm } from "./login-form";

// La server action se mockea: acá se prueba el contrato formulario ↔ acción
// (qué se envía, cómo se muestran los tres resultados posibles). El flujo
// real contra el backend lo cubre e2e/admin-login.spec.ts.
vi.mock("./actions", () => ({ loginAction: vi.fn() }));

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Correo electrónico"), "admin@example.test");
  await user.type(screen.getByLabelText("Contraseña"), "Secreta123!");
  await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));
}

describe("LoginForm (integración de componente con la server action mockeada)", () => {
  it("envía credenciales y el destino de redirección", async () => {
    const user = userEvent.setup();
    vi.mocked(loginAction).mockResolvedValue({ ok: false, error: "Credenciales inválidas" });
    render(<LoginForm redirectTo="/admin/publicaciones" />);

    await fillAndSubmit(user);

    expect(loginAction).toHaveBeenCalledWith("admin@example.test", "Secreta123!", "/admin/publicaciones");
  });

  it("muestra el error como alerta accesible", async () => {
    const user = userEvent.setup();
    vi.mocked(loginAction).mockResolvedValue({ ok: false, error: "Credenciales inválidas" });
    const { container } = render(<LoginForm redirectTo={null} />);

    await fillAndSubmit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("Credenciales inválidas");
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeEnabled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("deshabilita el botón mientras la acción está en curso", async () => {
    const user = userEvent.setup();
    let resolve!: (value: { ok: false; error: string }) => void;
    vi.mocked(loginAction).mockReturnValue(new Promise((r) => (resolve = r)));
    render(<LoginForm redirectTo={null} />);

    await fillAndSubmit(user);

    expect(screen.getByRole("button", { name: "Verificando…" })).toBeDisabled();
    resolve({ ok: false, error: "x" });
    await waitFor(() => expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeEnabled());
  });

  it("no envía nada si faltan campos obligatorios (validación nativa)", async () => {
    const user = userEvent.setup();
    render(<LoginForm redirectTo={null} />);
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(loginAction).not.toHaveBeenCalled();
  });
});
