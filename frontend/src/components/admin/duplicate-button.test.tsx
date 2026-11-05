import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DuplicateButton } from "./duplicate-button";

describe("botón Duplicar", () => {
  it("llama a la acción y muestra el error si no se pudo", async () => {
    const action = vi.fn().mockResolvedValue({ ok: false, error: "No tienes permiso." });
    render(<DuplicateButton action={action} />);
    await userEvent.click(screen.getByRole("button", { name: "Duplicar" }));
    expect(action).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("alert")).toHaveTextContent("No tienes permiso.");
  });
});
