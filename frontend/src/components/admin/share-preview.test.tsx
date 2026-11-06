import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { SharePreview, shareText } from "./share-preview";

describe("shareText", () => {
  it("usa lo propio si existe y si no, el título y la descripción", () => {
    expect(shareText({ title: "Título", excerpt: "Descripción", seoTitle: "", metaDescription: "" })).toEqual({
      title: "Título",
      description: "Descripción",
    });
    expect(shareText({ title: "Título", excerpt: "Descripción", seoTitle: "Para redes", metaDescription: "Meta" })).toEqual({
      title: "Para redes",
      description: "Meta",
    });
  });

  it("recorta como lo hace Google (60 y 160 caracteres)", () => {
    const { title, description } = shareText({ title: "a".repeat(80), excerpt: "b".repeat(200), seoTitle: "", metaDescription: "" });
    expect(title).toHaveLength(60);
    expect(title.endsWith("…")).toBe(true);
    expect(description).toHaveLength(160);
  });
});

describe("SharePreview", () => {
  it("muestra el resultado de Google y la tarjeta de redes", async () => {
    const { container } = render(
      <SharePreview
        siteName="Ecos del Camino"
        path="/publicaciones/una-ruta"
        title="Una ruta por el valle"
        description="Tres días caminando entre pueblos."
        imageUrl="https://picsum.photos/seed/x/1200/630"
      />,
    );
    expect(screen.getByText("Así aparece en Google")).toBeInTheDocument();
    expect(screen.getByText("Así se ve al compartir en redes")).toBeInTheDocument();
    expect(screen.getAllByText("Una ruta por el valle")).toHaveLength(2);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("sin imagen lo avisa en vez de dejar un hueco", () => {
    render(<SharePreview siteName="Sitio" path="/x" title="T" description="" imageUrl={null} />);
    expect(screen.getByText("Agrega una foto: la primera es la portada al compartir")).toBeInTheDocument();
  });
});
