import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { PhotoCreditFields } from "./photo-credit-fields";
import { photoCreditError } from "@/lib/admin/photo-credit";

function Harness({ onChange }: { onChange: (v: { credit: string | null; rightsConfirmed: boolean }) => void }) {
  const [value, setValue] = useState<{ credit: string | null; rightsConfirmed: boolean }>({ credit: null, rightsConfirmed: false });
  return (
    <PhotoCreditFields
      index={0}
      credit={value.credit}
      rightsConfirmed={value.rightsConfirmed}
      showError
      onChange={(patch) => {
        setValue(patch);
        onChange(patch);
      }}
    />
  );
}

describe("¿De quién es la foto?", () => {
  it("propia no pide nada; ajena pide nombre y permiso por escrito", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    expect(screen.getByRole("radio", { name: "Mía" })).toBeChecked();
    expect(screen.queryByRole("alert")).toBeNull();

    await userEvent.click(screen.getByRole("radio", { name: "De otra persona" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Escribe de quién es la foto.");
    await userEvent.type(screen.getByLabelText("Autor de la foto 1"), "Ana Ríos");
    expect(screen.getByRole("alert")).toHaveTextContent("Confirma que tienes su permiso");
    await userEvent.click(screen.getByRole("checkbox", { name: /Tengo su permiso por escrito/ }));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(onChange).toHaveBeenLastCalledWith({ credit: "Ana Ríos", rightsConfirmed: true });
  });

  it("misma regla que el backend", () => {
    expect(photoCreditError(null, undefined)).toBeNull();
    expect(photoCreditError("Ana", true)).toBeNull();
    expect(photoCreditError("Ana", false)).toMatch(/permiso/);
    expect(photoCreditError(" ", true)).toMatch(/de quién/);
    expect(photoCreditError("x".repeat(121), true)).toMatch(/120/);
  });
});
