import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ViewBeacon } from "./view-beacon";

describe("ViewBeacon", () => {
  afterEach(() => vi.restoreAllMocks());

  it("avisa la visita una sola vez por montaje, sin dibujar nada", () => {
    const beacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true });

    const { container, rerender } = render(<ViewBeacon type="GALLERY" id="0b0e7f6a-1c2d-4e5f-8a9b-0c1d2e3f4a5b" />);
    rerender(<ViewBeacon type="GALLERY" id="0b0e7f6a-1c2d-4e5f-8a9b-0c1d2e3f4a5b" />);

    expect(container).toBeEmptyDOMElement();
    expect(beacon).toHaveBeenCalledTimes(1);
    expect(beacon).toHaveBeenCalledWith("/api/views?type=GALLERY&id=0b0e7f6a-1c2d-4e5f-8a9b-0c1d2e3f4a5b");
  });

  it("usa fetch si el navegador no tiene sendBeacon", () => {
    Object.defineProperty(navigator, "sendBeacon", { value: undefined, configurable: true });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    render(<ViewBeacon type="PUBLICATION" id="0b0e7f6a-1c2d-4e5f-8a9b-0c1d2e3f4a5b" />);

    expect(fetchSpy).toHaveBeenCalledWith("/api/views?type=PUBLICATION&id=0b0e7f6a-1c2d-4e5f-8a9b-0c1d2e3f4a5b",
      { method: "POST", keepalive: true });
  });
});
