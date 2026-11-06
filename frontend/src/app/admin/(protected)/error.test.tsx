import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AdminError from "./error";

describe("Error del panel", () => {
  it("explica en simple, ofrece reintentar y no muestra detalles técnicos", async () => {
    const retry = vi.fn();
    render(<AdminError error={Object.assign(new Error("ECONNREFUSED 10.0.0.3:8080"), { digest: "abc123" })} retry={retry} />);
    expect(screen.getByRole("heading", { name: "Algo salió mal al cargar esta sección" })).toBeInTheDocument();
    expect(screen.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument();
    expect(screen.getByText(/abc123/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Ir al inicio del panel" })).toHaveAttribute("href", "/admin");
  });
});
