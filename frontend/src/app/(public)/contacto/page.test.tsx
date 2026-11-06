import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PlatformSettings } from "@/lib/api/types";
import { getPlatformSettings } from "@/lib/api/client";
import ContactPage from "./page";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api/client", () => ({ getPlatformSettings: vi.fn() }));

const base = {
  name: "Ecos", description: null, logoUrl: null, logoDarkUrl: null, faviconUrl: null, ogImageUrl: null, seoDefaultTitle: null,
  googleSearchConsoleVerification: null, contactEmail: "hola@ecos.test", adsenseEnabled: false, adsenseClientId: null,
  analyticsId: null, homeCountry: "PE", whatsappChannelUrl: null, youtubeUrl: null, instagramUrl: null, tiktokUrl: null,
  facebookUrl: null, xUrl: null,
} as PlatformSettings;

describe("Contacto", () => {
  it("con redes configuradas, muestra «Síguenos» con sus enlaces", async () => {
    vi.mocked(getPlatformSettings).mockResolvedValue({ ...base, youtubeUrl: "https://youtube.com/@ecos" });
    render(await ContactPage());
    expect(screen.getByRole("heading", { name: "Síguenos" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ecos en YouTube" })).toHaveAttribute("href", "https://youtube.com/@ecos");
  });

  it("sin redes, no hay sección vacía", async () => {
    vi.mocked(getPlatformSettings).mockResolvedValue(base);
    render(await ContactPage());
    expect(screen.queryByRole("heading", { name: "Síguenos" })).toBeNull();
  });
});
