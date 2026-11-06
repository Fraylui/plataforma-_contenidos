import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { YouTubeChannelProvider, YouTubeSubscribe, youtubeSubscribeUrl } from "./youtube-subscribe";

describe("Suscríbete en YouTube", () => {
  it("abre el canal con la ventana de suscripción, solo en enlaces de canal", () => {
    expect(youtubeSubscribeUrl("https://youtube.com/@ecos")).toBe("https://youtube.com/@ecos?sub_confirmation=1");
    expect(youtubeSubscribeUrl("https://www.youtube.com/channel/UC123/")).toBe("https://www.youtube.com/channel/UC123/?sub_confirmation=1");
    expect(youtubeSubscribeUrl("https://youtu.be/abc")).toBe("https://youtu.be/abc");
  });

  it("con canal configurado, el botón abre en otra pestaña", () => {
    render(
      <YouTubeChannelProvider url="https://youtube.com/@ecos">
        <YouTubeSubscribe />
      </YouTubeChannelProvider>,
    );
    const link = screen.getByRole("link", { name: /Suscríbete en YouTube/ });
    expect(link).toHaveAttribute("href", "https://youtube.com/@ecos?sub_confirmation=1");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("sin canal configurado no aparece (lo vacío no existe)", () => {
    const { container } = render(<YouTubeSubscribe />);
    expect(container).toBeEmptyDOMElement();
  });
});
