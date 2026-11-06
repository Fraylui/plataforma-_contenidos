import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkeletonImage } from "./skeleton-image";

describe("SkeletonImage: la foto principal de la pantalla (LCP)", () => {
  it("con priority carga ya, con prioridad alta y sin fundido", () => {
    const { container } = render(<SkeletonImage src="/api/v1/images/a/file" alt="" priority />);
    const img = container.querySelector("img")!;

    expect(img).not.toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("fetchpriority", "high");
    expect(img.className).not.toContain("opacity-0");
  });

  it("sin priority espera a acercarse a la pantalla", () => {
    const { container } = render(<SkeletonImage src="/api/v1/images/a/file" alt="" />);
    const img = container.querySelector("img")!;

    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).not.toHaveAttribute("fetchpriority");
  });
});
