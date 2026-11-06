import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { ChangePasswordForm } from "./change-password-form";
import { changePasswordAction } from "@/app/admin/(protected)/cuenta/actions";

vi.mock("@/app/admin/(protected)/cuenta/actions", () => ({
  changePasswordAction: vi.fn().mockResolvedValue({ ok: true, data: null }),
}));

async function fill(current: string, next: string, confirm: string) {
  if (current) await userEvent.type(screen.getByLabelText("Contraseña actual"), current);
  if (next) await userEvent.type(screen.getByLabelText("Contraseña nueva"), next);
  if (confirm) await userEvent.type(screen.getByLabelText("Repite la contraseña nueva"), confirm);
  await userEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));
}

describe("ChangePasswordForm", () => {
  it("valida antes de enviar: 12 caracteres, en el campo y con foco en el primer error", async () => {
    render(<ChangePasswordForm temporary={false} />);
    await fill("ClaveActual123", "corta", "corta");
    const next = screen.getByLabelText("Contraseña nueva");
    expect(next).toHaveAttribute("aria-invalid", "true");
    expect(next).toHaveAccessibleDescription(/Usa al menos 12 caracteres\./);
    expect(next).toHaveFocus();
    expect(changePasswordAction).not.toHaveBeenCalled();
  });

  it("la confirmación distinta marca el campo de confirmación", async () => {
    render(<ChangePasswordForm temporary={false} />);
    await fill("ClaveActual123", "OtraClaveNueva1", "OtraClaveNueva2");
    expect(screen.getByLabelText("Repite la contraseña nueva")).toHaveAccessibleDescription("Las contraseñas no coinciden.");
    expect(changePasswordAction).not.toHaveBeenCalled();
  });

  it("la nueva tiene que ser distinta de la actual", async () => {
    render(<ChangePasswordForm temporary={false} />);
    await fill("ClaveActual123", "ClaveActual123", "ClaveActual123");
    expect(screen.getByText("Usa una contraseña distinta de la actual.")).toBeInTheDocument();
    expect(changePasswordAction).not.toHaveBeenCalled();
  });

  it("con datos válidos envía al servidor", async () => {
    render(<ChangePasswordForm temporary={false} />);
    await fill("ClaveActual123", "OtraClaveNueva1", "OtraClaveNueva1");
    expect(changePasswordAction).toHaveBeenCalledWith("ClaveActual123", "OtraClaveNueva1");
  });

  it("con contraseña temporal lo explica", async () => {
    const { container } = render(<ChangePasswordForm temporary />);
    expect(screen.getByText(/contraseña temporal/i)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
