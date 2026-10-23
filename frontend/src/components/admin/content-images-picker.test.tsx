import { describe, expect, it, vi } from "vitest";
import { shortImageLabel } from "./content-images-picker";

vi.mock("@/app/admin/(protected)/imagenes/actions", () => ({ uploadImageInlineAction: vi.fn() }));

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
