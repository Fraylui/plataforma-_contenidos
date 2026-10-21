import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BrokenImageNotice, PreviewImage } from "@/components/ui/preview-image";

describe("PreviewImage", () => {
  it("si el enlace no carga muestra el aviso en vez del ícono roto y lo informa", () => {
    const onError = vi.fn();
    const { container } = render(
      <PreviewImage src="https://ejemplo.test/no-existe.jpg" fallback={<BrokenImageNotice />} onError={onError} />,
    );
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByRole("img", { name: "No se pudo cargar la imagen" })).toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
