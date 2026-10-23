import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlatformSettings } from "@/lib/api/types";
import { updatePlatformSettingsAction } from "@/app/admin/(protected)/configuracion/actions";
import { PlatformSettingsForm } from "./platform-settings-form";

vi.mock("@/app/admin/(protected)/configuracion/actions", () => ({ updatePlatformSettingsAction: vi.fn() }));
vi.mock("@/app/admin/(protected)/imagenes/actions", () => ({ uploadImageInlineAction: vi.fn() }));

const settings: PlatformSettings = {
  name: "Ecos del Camino",
  description: "Lugares, historia y curiosidades.",
  logoUrl: null,
  logoDarkUrl: null,
  faviconUrl: null,
  ogImageUrl: null,
  seoDefaultTitle: null,
  googleSearchConsoleVerification: null,
  contactEmail: "hola@ecos.test",
  adsenseEnabled: false,
  adsenseClientId: null,
  analyticsId: null,
  homeCountry: "PE",
  whatsappChannelUrl: null,
  youtubeUrl: null,
  instagramUrl: null,
  tiktokUrl: null,
  facebookUrl: null,
  xUrl: null,
};

beforeEach(() => vi.mocked(updatePlatformSettingsAction).mockReset());

describe("PlatformSettingsForm", () => {
  it("se organiza en secciones con lenguaje de plataforma, sin jerga técnica", async () => {
    const { container } = render(<PlatformSettingsForm settings={settings} />);
    for (const title of ["Marca", "Al compartir y en Google", "Nuestras redes", "Contacto", "Ingresos", "Medición", "Avanzado"]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
    expect(container.textContent).not.toMatch(/Open Graph|SEO|Meta descripción|Client ID/);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("la barra de guardado aparece solo con cambios, y «Descartar» los quita", async () => {
    render(<PlatformSettingsForm settings={settings} />);
    expect(screen.queryByText("Tienes cambios sin guardar")).toBeNull();
    await userEvent.type(screen.getByLabelText("Nombre de la plataforma"), " Plus");
    expect(screen.getByText("Tienes cambios sin guardar")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Descartar" }));
    expect(screen.getByLabelText("Nombre de la plataforma")).toHaveValue("Ecos del Camino");
    expect(screen.queryByText("Tienes cambios sin guardar")).toBeNull();
  });

  it("un enlace de otra red se marca en el campo y no se guarda", async () => {
    render(<PlatformSettingsForm settings={settings} />);
    await userEvent.type(screen.getByLabelText("YouTube"), "https://instagram.com/ecos");
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(screen.getByLabelText("YouTube")).toHaveAccessibleDescription(/Pega el enlace de YouTube/);
    expect(updatePlatformSettingsAction).not.toHaveBeenCalled();
  });

  it("guarda las redes oficiales junto con el resto", async () => {
    vi.mocked(updatePlatformSettingsAction).mockResolvedValue({ ok: true } as never);
    render(<PlatformSettingsForm settings={settings} />);
    await userEvent.type(screen.getByLabelText("TikTok"), "https://tiktok.com/@ecos");
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(updatePlatformSettingsAction).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Ecos del Camino", tiktokUrl: "https://tiktok.com/@ecos", youtubeUrl: null }),
    );
  });
});
