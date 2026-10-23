import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmActionButton } from "./confirm-action-button";

describe("ConfirmActionButton: borrar pide confirmación", () => {
  it("no ejecuta nada hasta confirmar", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    render(<ConfirmActionButton action={action} label="Eliminar" title="¿Eliminar esta campaña?" description="No se puede deshacer." />);

    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog", { name: "¿Eliminar esta campaña?" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sí, eliminar" }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  });

  it("cancelar no ejecuta la acción", () => {
    const action = vi.fn();
    render(<ConfirmActionButton action={action} label="Eliminar" title="¿Eliminar?" description="x" />);

    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(action).not.toHaveBeenCalled();
  });
});
