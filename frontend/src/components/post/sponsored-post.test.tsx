import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePlannedCampaign } from "@/components/legal/use-ad-rotation";
import { AdBlockClient } from "@/components/legal/ad-block-client";
import { BANNER_FIELDS } from "@/lib/ads/test-campaigns";

// next/dynamic no resuelve la carga diferida en Vitest: lo mismo que hace por dentro, con React.lazy y Suspense.
vi.mock("next/dynamic", async () => {
  const { createElement, lazy, Suspense } = await import("react");
  return {
    default: (load: () => Promise<React.ComponentType<object>>) => {
      const Lazy = lazy(async () => ({ default: await load() }));
      return function Dynamic(props: object) {
        return createElement(Suspense, { fallback: null }, createElement(Lazy, props));
      };
    },
  };
});
vi.mock("@/components/legal/use-ad-rotation", () => ({ usePlannedCampaign: vi.fn() }));
vi.mock("@/components/legal/use-viewable-impression", () => ({ useViewableImpression: () => {} }));

const campaign = { ...BANNER_FIELDS, id: "c1", advertiserId: "a1", imageSrc: null, externalImageUrl: "https://ads.example/b.png", imageAlt: "Café Origen" };

describe("Anuncio del feed con forma de post («Patrocinado»)", () => {
  beforeEach(() => vi.mocked(usePlannedCampaign).mockReset());

  it("con campaña: encabezado «Patrocinado» y la creatividad sin repetir «Publicidad»", async () => {
    vi.mocked(usePlannedCampaign).mockReturnValue({ rotation: { width: 300, height: 250, campaigns: [] }, campaign } as never);
    const { container } = render(<AdBlockClient position="en-feed" layout="fill" frame="post" adsense={null} />);
    const post = screen.getByRole("article", { name: "Patrocinado" });
    expect(post).toHaveTextContent("Patrocinado");
    expect(screen.getByRole("img", { name: "Café Origen" })).toBeInTheDocument();
    expect(screen.queryByText("Publicidad")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("una campaña nativa se dibuja como post del anunciante, no como banner", async () => {
    const native = {
      ...campaign,
      format: "NATIVE" as const,
      externalImageUrl: null,
      advertiserName: "Pollería El Inca",
      primaryText: "2x1 los martes",
      callToAction: "ORDER" as const,
      youtubeVideoId: "dQw4w9WgXcQ",
      mediaAspect: "16:9" as const,
    };
    vi.mocked(usePlannedCampaign).mockReturnValue({ rotation: { width: 300, height: 250, campaigns: [] }, campaign: native } as never);
    render(<AdBlockClient position="en-feed" layout="fill" frame="post" adsense={null} />);
    // Se descarga bajo demanda (next/dynamic): llega después del primer render.
    // La primera vez Vitest tarda en transformar ese módulo: más margen que el segundo por defecto.
    expect(await screen.findByRole("article", { name: "Patrocinado: Pollería El Inca" }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Pedir ahora/ })).toBeInTheDocument();
  });

  it("sin campaña ni AdSense no dibuja nada (ni el encabezado)", () => {
    vi.mocked(usePlannedCampaign).mockReturnValue(null);
    const { container } = render(<AdBlockClient position="en-feed" layout="fill" frame="post" adsense={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("mientras pregunta no dibuja nada", () => {
    vi.mocked(usePlannedCampaign).mockReturnValue(undefined);
    const { container } = render(<AdBlockClient position="en-feed" layout="fill" frame="post" adsense={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
