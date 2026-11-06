import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PostSources } from "./post-sources";
import { MediaCaption } from "@/components/content/media-carousel";
import { cleanSources, isValidSourceUrl, sourceName } from "@/lib/admin/sources";

describe("fuentes y crédito en el sitio", () => {
  it("«Fuentes:» con el nombre del sitio y enlace", () => {
    render(<PostSources sources={["https://www.promperu.gob.pe/destinos", "https://inei.gob.pe/x"]} />);
    expect(screen.getByText("Fuentes:")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "promperu.gob.pe" })).toHaveAttribute("href", "https://www.promperu.gob.pe/destinos");
    expect(screen.getByRole("link", { name: "inei.gob.pe" })).toHaveAttribute("target", "_blank");
  });

  it("sin fuentes no aparece", () => {
    const { container } = render(<PostSources sources={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("la foto de otra persona muestra «Foto: autor»", () => {
    render(<MediaCaption title={null} caption="Atardecer" credit="Ana Ríos" />);
    expect(screen.getByText(/Foto:/)).toHaveTextContent("Foto: Ana Ríos");
  });

  it("reglas de enlaces iguales al backend", () => {
    expect(isValidSourceUrl("https://www.promperu.gob.pe")).toBe(true);
    expect(isValidSourceUrl("Promperú")).toBe(false);
    expect(isValidSourceUrl("javascript:alert(1)")).toBe(false);
    expect(cleanSources([" https://a.pe ", "", "https://a.pe"])).toEqual(["https://a.pe"]);
    expect(sourceName("https://www.inei.gob.pe/x")).toBe("inei.gob.pe");
  });
});
