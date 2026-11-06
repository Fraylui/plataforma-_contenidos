import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SocialFollow } from "./social-follow";

describe("SocialFollow («Síguenos»)", () => {
  it("un ícono por red, con nombre accesible, en otra pestaña y sin pasar datos", () => {
    render(
      <SocialFollow
        brandName="Ecos"
        links={[
          { key: "youtube", label: "YouTube", url: "https://youtube.com/@ecos" },
          { key: "tiktok", label: "TikTok", url: "https://tiktok.com/@ecos" },
        ]}
      />,
    );
    expect(screen.getByText("Síguenos")).toBeInTheDocument();
    const youtube = screen.getByRole("link", { name: "Ecos en YouTube" });
    expect(youtube).toHaveAttribute("href", "https://youtube.com/@ecos");
    expect(youtube).toHaveAttribute("target", "_blank");
    expect(youtube).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(screen.getByRole("link", { name: "Ecos en TikTok" })).toBeInTheDocument();
  });

  it("sin redes configuradas no ocupa lugar", () => {
    const { container } = render(<SocialFollow brandName="Ecos" links={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
