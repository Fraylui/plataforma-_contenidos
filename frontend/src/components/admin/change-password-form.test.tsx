import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { ChangePasswordForm } from "./change-password-form";

vi.mock("@/app/admin/(protected)/cuenta/actions", () => ({
  changePasswordAction: vi.fn().mockResolvedValue({ ok: true, data: null }),
}));

describe("ChangePasswordForm", () => {
  it("valida antes de enviar: 12 caracteres y confirmación igual", async () => {
    render(<ChangePasswordForm temporary={false} />);
    await userEvent.type(screen.getByLabelText("Contraseña actual"), "ClaveActual123");
    await userEvent.type(screen.getByLabelText("Contraseña nueva"), "corta");
    await userEvent.type(screen.getByLabelText("Repite la contraseña nueva"), "corta");
    await userEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));
    expect(screen.getByText("Usa al menos 12 caracteres.")).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText("Contraseña nueva"));
    await userEvent.type(screen.getByLabelText("Contraseña nueva"), "OtraClaveNueva1");
    await userEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));
    expect(screen.getByText("Las contraseñas no coinciden.")).toBeInTheDocument();
  });

  it("con contraseña temporal lo explica", async () => {
    const { container } = render(<ChangePasswordForm temporary />);
    expect(screen.getByText(/contraseña temporal/i)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
