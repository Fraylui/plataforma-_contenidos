import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BrokenImageNotice, PreviewImage } from "./preview-image";
import { shortImageLabel } from "./content-images-picker";

vi.mock("@/app/admin/(protected)/imagenes/actions", () => ({ uploadImageInlineAction: vi.fn() }));

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

describe("shortImageLabel", () => {
  it("deja el dominio y el archivo, legible, para distinguir enlaces del mismo sitio", () => {
    expect(
      shortImageLabel(
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Procesi%C3%B3n_en_Huamanga.jpg/1280px-Procesi%C3%B3n_en_Huamanga.jpg",
      ),
    ).toBe("upload.wikimedia.org … 1280px-Procesión_en_Huamanga.jpg");
  });

  it("lo que no es un enlace válido se muestra tal cual", () => {
    expect(shortImageLabel("foto sin enlace")).toBe("foto sin enlace");
  });
});
