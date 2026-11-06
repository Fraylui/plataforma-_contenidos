import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThumbImage } from "./thumb-image";

describe("ThumbImage: miniaturas que no compiten con la foto principal", () => {
  it("una foto subida pasa por el optimizador a su tamaño, en diferido", () => {
    const { container } = render(
      <ThumbImage src="http://localhost:8080/api/v1/images/abc/file" size={60} className="rounded-full" />,
    );
    const img = container.querySelector("img")!;

    expect(img.getAttribute("src")).toContain("/_next/image?url=");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("width", "60");
  });

  it("un enlace externo va directo, en diferido y con prioridad baja", () => {
    const { container } = render(<ThumbImage src="https://picsum.photos/seed/a/1600/900" size={32} />);
    const img = container.querySelector("img")!;

    expect(img).toHaveAttribute("src", "https://picsum.photos/seed/a/1600/900");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("fetchpriority", "low");
    expect(img).toHaveAttribute("width", "32");
    expect(img).toHaveAttribute("alt", "");
  });
});
