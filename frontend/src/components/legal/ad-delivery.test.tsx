import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ResolvedRotation } from "@/lib/api/types";
import { DirectCampaignBanner } from "./direct-campaign-banner";
import { AdBlockClient } from "./ad-block-client";

vi.mock("next/navigation", () => ({ usePathname: () => "/prueba" }));

/** IntersectionObserver controlable: el test decide cuánto del anuncio está en pantalla. */
let observerCallback: IntersectionObserverCallback | null = null;
function setVisibleRatio(ratio: number) {
  act(() => {
    observerCallback?.([{ isIntersecting: ratio > 0, intersectionRatio: ratio } as IntersectionObserverEntry], {} as IntersectionObserver);
  });
}

const campaign = { id: "11111111-1111-1111-1111-111111111111", advertiserId: "adv-1", imageSrc: null, externalImageUrl: "https://example.com/a.png", imageAlt: "Café Origen" };

describe("DirectCampaignBanner — impresión visible", () => {
  const beacon = vi.fn(() => true);

  beforeEach(() => {
    vi.useFakeTimers();
    observerCallback = null;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: IntersectionObserverCallback) {
          observerCallback = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true });
    beacon.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("muestra la creatividad entera con la etiqueta Publicidad fuera de la imagen", () => {
    render(<DirectCampaignBanner campaign={campaign} width={300} height={250} />);
    expect(screen.getByText("Publicidad").tagName).toBe("FIGCAPTION");
    const link = screen.getByRole("link", { name: "Café Origen" });
    expect(link).toHaveAttribute("rel", expect.stringContaining("sponsored"));
    expect(link.style.aspectRatio).toBe("300 / 250");
    expect(screen.getByRole("img")).toHaveClass("object-contain");
  });

  it("cuenta la impresión solo tras 1 s con al menos la mitad en pantalla, y una sola vez", () => {
    render(<DirectCampaignBanner campaign={campaign} width={300} height={250} />);

    setVisibleRatio(0.3);
    act(() => vi.advanceTimersByTime(2000));
    expect(beacon).not.toHaveBeenCalled();

    setVisibleRatio(0.6);
    act(() => vi.advanceTimersByTime(600));
    setVisibleRatio(0); // se fue antes del segundo: no cuenta, el reloj vuelve a cero
    act(() => vi.advanceTimersByTime(1000));
    expect(beacon).not.toHaveBeenCalled();

    setVisibleRatio(0.6);
    act(() => vi.advanceTimersByTime(1000));
    expect(beacon).toHaveBeenCalledTimes(1);
    expect(beacon).toHaveBeenCalledWith(`/api/ads/impression?id=${campaign.id}`);

    setVisibleRatio(0);
    setVisibleRatio(1);
    act(() => vi.advanceTimersByTime(5000));
    expect(beacon).toHaveBeenCalledTimes(1);
  });
});

describe("AdBlockClient — sin repetir campaña en la página", () => {
  const rotation: ResolvedRotation = {
    width: 300,
    height: 250,
    campaigns: [
      { ...campaign, id: "aaaaaaaa-0000-0000-0000-000000000001", imageAlt: "Primera" },
      { ...campaign, id: "aaaaaaaa-0000-0000-0000-000000000002", imageAlt: "Segunda" },
    ],
  };

  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(rotation), { status: 200 })));
  });

  afterEach(() => vi.unstubAllGlobals());

  it("cada espacio toma otra campaña; los sobrantes sin AdSense quedan vacíos", async () => {
    const { container } = render(
      <>
        <AdBlockClient position="en-feed" slot={0} adsense={null} />
        <AdBlockClient position="en-feed" slot={1} adsense={null} />
        <AdBlockClient position="en-feed" slot={2} adsense={null} />
      </>,
    );
    expect(await screen.findByRole("link", { name: "Primera" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Segunda" })).toBeInTheDocument();
    expect(container.querySelectorAll("figure")).toHaveLength(2);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
