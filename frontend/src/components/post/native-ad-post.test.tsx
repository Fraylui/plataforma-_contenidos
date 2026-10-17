import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ResolvedCampaign } from "@/lib/api/types";
import { NativeAdPost } from "./native-ad-post";

vi.mock("@/components/legal/use-viewable-impression", () => ({ useViewableImpression: () => {} }));

const base: ResolvedCampaign = {
  id: "11111111-1111-1111-1111-111111111111",
  advertiserId: "a1",
  format: "NATIVE",
  imageSrc: null,
  externalImageUrl: null,
  imageAlt: null,
  advertiserName: "Pollería El Inca",
  advertiserLogoSrc: null,
  primaryText: "2x1 los martes en todo el menú",
  headline: "Pollo a la brasa",
  callToAction: "WHATSAPP",
  displayDomain: "wa.me",
  youtubeVideoId: "dQw4w9WgXcQ",
  mediaAspect: "16:9",
};

describe("Anuncio nativo del feed (estilo Instagram/Facebook)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(null, { status: 204 }))));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("muestra quién anuncia, «Patrocinado», el texto y el botón que pasa por el clic contado", async () => {
    const { container } = render(<NativeAdPost campaign={base} />);
    const post = screen.getByRole("article", { name: "Patrocinado: Pollería El Inca" });
    expect(post).toHaveTextContent("Patrocinado");
    expect(post).toHaveTextContent("2x1 los martes en todo el menú");
    expect(post).toHaveTextContent("wa.me");
    const cta = screen.getByRole("link", { name: /Escribir por WhatsApp/ });
    expect(cta).toHaveAttribute("href", expect.stringContaining(`/api/v1/ads/campaigns/${base.id}/click`));
    expect(cta).toHaveAttribute("rel", expect.stringContaining("sponsored"));
    expect(cta).toHaveAttribute("target", "_blank");
    // Sin me gusta ni compartir: no se mezcla con el contenido propio.
    expect(screen.queryByRole("button", { name: /Me gusta/ })).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("el video de YouTube carga recién al tocar y cuenta la reproducción", async () => {
    render(<NativeAdPost campaign={base} />);
    expect(document.querySelector("iframe")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Reproducir video: Pollo a la brasa" }));
    const iframe = document.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toContain("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1");
    expect(fetch).toHaveBeenCalledWith(`/api/ads/play?id=${base.id}`, expect.objectContaining({ method: "POST" }));
  });

  it("con foto, la foto lleva al destino y no hay reproductor", () => {
    render(<NativeAdPost campaign={{ ...base, youtubeVideoId: null, mediaAspect: "1:1", imageSrc: "/foto.jpg", imageAlt: "Pollo" }} />);
    expect(screen.getByRole("img", { name: "Pollo" }).closest("a")).toHaveAttribute(
      "href",
      expect.stringContaining("/click"),
    );
    expect(screen.queryByRole("button", { name: /Reproducir/ })).toBeNull();
  });

  it("un texto largo se corta y «más» lo muestra entero", async () => {
    const long = "Promoción especial. ".repeat(20).trim();
    render(<NativeAdPost campaign={{ ...base, primaryText: long }} />);
    await userEvent.click(screen.getByRole("button", { name: "más" }));
    expect(screen.queryByRole("button", { name: "más" })).toBeNull();
  });

  it("«Ocultar este anuncio» lo saca, se recuerda y se puede deshacer", async () => {
    render(<NativeAdPost campaign={base} />);
    await userEvent.click(screen.getByRole("button", { name: "Opciones del anuncio" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Ocultar este anuncio" }));
    expect(screen.queryByRole("article")).toBeNull();
    expect(screen.getByText("Ocultaste este anuncio.")).toBeInTheDocument();
    expect(window.localStorage.getItem("ads:hidden")).toContain(base.id);

    await userEvent.click(screen.getByRole("button", { name: "Deshacer" }));
    expect(screen.getByRole("article")).toBeInTheDocument();
    expect(window.localStorage.getItem("ads:hidden")).not.toContain(base.id);
  });

  it("«¿Por qué veo este anuncio?» explica que es por lo que se está viendo, no por datos personales", async () => {
    render(<NativeAdPost campaign={base} />);
    await userEvent.click(screen.getByRole("button", { name: "Opciones del anuncio" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "¿Por qué veo este anuncio?" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("No usamos tu historial");
  });
});
