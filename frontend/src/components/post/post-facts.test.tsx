import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { CalendarBlank, Phone } from "@phosphor-icons/react/dist/ssr";
import { publicCsp } from "@/lib/security/csp";
import { PostFacts } from "./post-facts";

vi.mock("@/lib/server-image-url", () => ({ serverImageUrl: (p: string) => p }));

describe("PostFacts — datos útiles del post", () => {
  it("filas con ícono, etiqueta en minúsculas y valor enlazado cuando corresponde", async () => {
    const { container } = render(
      <PostFacts
        facts={[
          { icon: CalendarBlank, label: "Cuándo", value: "vie 12 dic., 7:00 p. m." },
          { icon: Phone, label: "Teléfono", value: "999 888 777", href: "tel:999888777" },
        ]}
        map={{ latitude: -13.16, longitude: -74.22, title: "Mirador" }}
      />,
    );
    expect(screen.getByText("Cuándo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /999 888 777/ })).toHaveAttribute("href", "tel:999888777");
    expect(screen.getByTitle("Mapa de Mirador")).toBeInTheDocument();
    expect(container.querySelector(".uppercase")).toBeNull();
    // iframes: false — el mapa es contenido de Google, jsdom no puede auditar marcos.
    expect(await axe(container, { iframes: false })).toHaveNoViolations();
  });

  it("el mapa usa un dominio que la CSP permite en frame-src (si no, el navegador lo bloquea)", () => {
    render(<PostFacts facts={[]} map={{ latitude: -13.16, longitude: -74.22, title: "Mirador" }} />);
    const src = new URL(screen.getByTitle("Mapa de Mirador").getAttribute("src") ?? "");
    const frameSrc = publicCsp({ dev: false }).split("; ").find((d) => d.startsWith("frame-src ")) ?? "";
    expect(frameSrc.split(" ")).toContain(src.origin);
  });

  it("sin datos ni mapa no muestra nada", () => {
    const { container } = render(<PostFacts facts={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
