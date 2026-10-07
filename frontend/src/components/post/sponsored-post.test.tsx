import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePlannedCampaign } from "@/components/legal/use-ad-rotation";
import { AdBlockClient } from "@/components/legal/ad-block-client";

vi.mock("@/components/legal/use-ad-rotation", () => ({ usePlannedCampaign: vi.fn() }));
vi.mock("@/components/legal/use-viewable-impression", () => ({ useViewableImpression: () => {} }));

const campaign = { id: "c1", advertiserId: "a1", imageSrc: null, externalImageUrl: "https://ads.example/b.png", imageAlt: "Café Origen" };

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
