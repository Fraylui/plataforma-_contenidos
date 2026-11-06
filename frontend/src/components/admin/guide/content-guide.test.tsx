import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { ContentGuide, PublishRulesCard } from "./content-guide";

describe("PublishRulesCard (en cada compositor)", () => {
  it("recuerda lo esencial: nada de promoción gratis de negocios y lo pagado va como anuncio", () => {
    render(<PublishRulesCard />);
    expect(screen.getByRole("heading", { name: "Antes de publicar" })).toBeInTheDocument();
    expect(screen.getByText(/promocione un negocio/)).toBeInTheDocument();
    expect(screen.getByText(/¿Te pagaron o te dieron algo a cambio/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Crear un anuncio/ })).toHaveAttribute("href", "/admin/anunciantes");
    expect(screen.getByRole("link", { name: /Ver la guía completa/ })).toHaveAttribute("href", "/admin/guia");
  });
});

describe("ContentGuide (página «Qué se puede publicar»)", () => {
  it("cubre las reglas con su respaldo legal y aclara que no es asesoría", async () => {
    const { container } = render(<ContentGuide />);
    for (const heading of [
      "Sí se publica",
      "Nada de promoción gratis de negocios",
      "Si hubo pago o canje, es publicidad",
      "Fotos, videos y textos",
      "Personas y datos personales",
      "Rubros sensibles",
      "Reglas de Google AdSense",
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    }
    expect(screen.getByText(/D\.L\. 1044/)).toBeInTheDocument();
    expect(screen.getByText(/Ley 29733/)).toBeInTheDocument();
    expect(screen.getByText(/no es asesoría legal/)).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
