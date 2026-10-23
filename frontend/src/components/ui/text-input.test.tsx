import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TextInput } from "./text-input";

describe("TextInput", () => {
  it("reenvía la ref al input (react-hook-form la necesita)", () => {
    const ref = createRef<HTMLInputElement>();
    render(<TextInput ref={ref} aria-label="Precio" />);
    expect(ref.current).toBe(screen.getByLabelText("Precio"));
  });

  it("invalid marca aria-invalid", () => {
    render(<TextInput aria-label="Precio" invalid />);
    expect(screen.getByLabelText("Precio")).toHaveAttribute("aria-invalid", "true");
  });

  it("muestra contenido al inicio y al final sin tapar el texto", () => {
    render(<TextInput aria-label="Precio" leading="S/" trailing="PEN" />);
    expect(screen.getByText("S/")).toBeInTheDocument();
    expect(screen.getByText("PEN")).toBeInTheDocument();
  });
});
