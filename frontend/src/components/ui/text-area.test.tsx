import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TextArea } from "./text-area";

describe("TextArea", () => {
  it("el contador parte del valor inicial", () => {
    render(<TextArea aria-label="Resumen" maxLength={160} defaultValue="Hola mundo" />);
    expect(screen.getByText("10/160")).toBeInTheDocument();
  });

  it("el contador sigue lo que se escribe", async () => {
    render(<TextArea aria-label="Resumen" maxLength={20} />);
    await userEvent.type(screen.getByLabelText("Resumen"), "abc");
    expect(screen.getByText("3/20")).toBeInTheDocument();
  });

  it("controlado: el contador refleja value", () => {
    render(<TextArea aria-label="Resumen" maxLength={50} value="12345" onChange={() => {}} />);
    expect(screen.getByText("5/50")).toBeInTheDocument();
  });

  it("sin maxLength no hay contador", () => {
    const { container } = render(<TextArea aria-label="Texto" />);
    expect(container.textContent).toBe("");
  });
});
