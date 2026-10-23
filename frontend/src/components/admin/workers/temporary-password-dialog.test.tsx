import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { TemporaryPasswordDialog } from "./temporary-password-dialog";

describe("TemporaryPasswordDialog", () => {
  it("muestra la contraseña una vez, la copia y lo advierte", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const { container } = render(<TemporaryPasswordDialog name="Ana Pérez" password="Abc23defGhi45jkmNPQr" onClose={() => {}} />);

    const dialog = screen.getByRole("dialog", { name: /Contraseña temporal de Ana Pérez/ });
    expect(dialog).toHaveTextContent("Abc23defGhi45jkmNPQr");
    expect(dialog).toHaveTextContent("No se volverá a mostrar");
    await userEvent.click(screen.getByRole("button", { name: "Copiar" }));
    expect(writeText).toHaveBeenCalledWith("Abc23defGhi45jkmNPQr");
    expect(await screen.findByText("Copiada")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
