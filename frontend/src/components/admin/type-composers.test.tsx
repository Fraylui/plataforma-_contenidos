import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import type { Category } from "@/lib/api/types";
import type { PublicationPermissions } from "@/lib/admin/publication";
import { PlaceComposer } from "./place-composer";
import { GalleryComposer } from "./gallery-composer";
import { CelebrationComposer } from "./celebration-composer";
import { BusinessComposer } from "./business-composer";
import { createPlaceAction } from "@/app/admin/(protected)/lugares/actions";
import { createGalleryAction } from "@/app/admin/(protected)/galerias/actions";
import { createCelebrationAction } from "@/app/admin/(protected)/celebraciones/actions";
import { createBusinessAction } from "@/app/admin/(protected)/directorio/actions";

const created = { ok: true, data: { id: "nuevo-1" } };
vi.mock("@/app/admin/(protected)/lugares/actions", () => ({ createPlaceAction: vi.fn(), updatePlaceAction: vi.fn() }));
vi.mock("@/app/admin/(protected)/galerias/actions", () => ({ createGalleryAction: vi.fn(), updateGalleryAction: vi.fn() }));
vi.mock("@/app/admin/(protected)/celebraciones/actions", () => ({ createCelebrationAction: vi.fn(), updateCelebrationAction: vi.fn() }));
vi.mock("@/app/admin/(protected)/directorio/actions", () => ({ createBusinessAction: vi.fn(), updateBusinessAction: vi.fn() }));
vi.mock("@/app/admin/(protected)/imagenes/actions", () => ({ uploadImageInlineAction: vi.fn() }));
vi.mock("@/app/admin/(protected)/publication-actions", () => ({ publicationStepAction: vi.fn().mockResolvedValue({ ok: true }) }));
vi.mock("./rich-text-editor", () => ({
  RichTextEditor: ({ value, onChange }: { value: string; onChange: (html: string) => void }) => (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));
// El mapa (Leaflet) no se dibuja en jsdom; las coordenadas se prueban por los campos.
vi.mock("next/dynamic", () => ({ default: () => () => null }));

const CATEGORIES = [{ id: "cat-1", name: "Viajes", slug: "viajes", description: null, parentId: null, active: true, sortOrder: 0 }] as Category[];
const PUBLISHER: PublicationPermissions = {
  canEdit: true,
  canPublish: true,
  canSchedule: true,
  canReturnToDraft: false,
  canArchive: false,
};
const common = { categories: CATEGORIES, allImages: [], permissions: PUBLISHER, siteName: "Ecos del Camino" };

async function saveDraft() {
  await userEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
}

describe("Compositor de Lugares", () => {
  it("pide el nombre y valida las coordenadas escritas a mano", async () => {
    const { container } = render(<PlaceComposer {...common} />);
    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Latitud"), "120");
    await saveDraft();
    expect(screen.getByLabelText("Nombre")).toHaveAccessibleDescription("Escribe el nombre del lugar.");
    expect(screen.getByLabelText("Latitud")).toHaveAccessibleDescription("La latitud va de -90 a 90.");
    expect(createPlaceAction).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  }, 15_000); // axe sobre el compositor completo: lento cuando la suite entera corre en paralelo

  it("con datos válidos manda name y coordenadas como números", async () => {
    vi.mocked(createPlaceAction).mockResolvedValue(created as never);
    render(<PlaceComposer {...common} />);
    await userEvent.type(screen.getByLabelText("Nombre"), "Laguna de Paca");
    await userEvent.type(screen.getByLabelText("Texto"), "Una laguna andina.");
    await userEvent.type(screen.getByLabelText("Latitud"), "-11.85");
    await userEvent.type(screen.getByLabelText("Longitud"), "-75.51");
    await saveDraft();
    expect(createPlaceAction).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Laguna de Paca", latitude: -11.85, longitude: -75.51, categoryId: "cat-1" }),
    );
  });
});

describe("Compositor de Galerías", () => {
  it("sin texto largo ni videos, y exige al menos una foto", async () => {
    render(<GalleryComposer {...common} />);
    expect(screen.queryByLabelText("Texto")).not.toBeInTheDocument();
    expect(screen.queryByText(/Videos de YouTube/)).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Título"), "Atardeceres");
    await saveDraft();
    expect(screen.getByRole("alert")).toHaveTextContent("Agrega al menos una foto.");
    expect(createGalleryAction).not.toHaveBeenCalled();
  });
});

describe("Compositor de Celebraciones", () => {
  it("por defecto es una fecha que se repite cada año, de todo el día, y se manda así", async () => {
    vi.mocked(createCelebrationAction).mockResolvedValue(created as never);
    render(<CelebrationComposer {...common} places={[]} homeCountry="PE" />);
    expect(screen.getByRole("radio", { name: "Se repite cada año" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Todo el día" })).toBeChecked();
    await userEvent.type(screen.getByLabelText("Título"), "Fiestas Patrias");
    await userEvent.type(screen.getByLabelText("Texto"), "La independencia del Perú.");
    await userEvent.type(screen.getByLabelText(/^Fecha/), "2026-07-28");
    await userEvent.type(screen.getByLabelText("Desde el año (opcional)"), "1821");
    expect(screen.getAllByText("28 de julio · desde 1821").length).toBeGreaterThan(0);
    await saveDraft();
    expect(createCelebrationAction).toHaveBeenCalledWith(
      expect.objectContaining({
        recursYearly: true,
        allDay: true,
        sinceYear: 1821,
        startsAt: "2026-07-28T05:00:00.000Z",
        endsAt: null,
        // Por defecto se celebra en el país del sitio: lo mundial se elige a propósito.
        scopeCountry: "PE",
        scopeRegion: null,
      }),
    );
  });

  it("una celebración regional exige la región y se manda con su país", async () => {
    vi.mocked(createCelebrationAction).mockResolvedValue(created as never);
    render(<CelebrationComposer {...common} places={[]} homeCountry="PE" />);
    await userEvent.type(screen.getByLabelText("Título"), "Semana Santa ayacuchana");
    await userEvent.type(screen.getByLabelText("Texto"), "Procesiones en Huamanga.");
    await userEvent.type(screen.getByLabelText(/^Fecha/), "2026-04-02");
    await userEvent.click(screen.getByRole("radio", { name: "Una región" }));
    await saveDraft();
    expect(screen.getByLabelText(/^Región/)).toHaveAccessibleDescription(/Escribe la región/);
    expect(createCelebrationAction).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText(/^Región/), "Ayacucho");
    expect(screen.getByText(/Ayacucho, Perú/)).toBeInTheDocument();
    await saveDraft();
    expect(createCelebrationAction).toHaveBeenCalledWith(expect.objectContaining({ scopeCountry: "PE", scopeRegion: "Ayacucho" }));
  });

  it("en todo el mundo no manda país ni región", async () => {
    vi.mocked(createCelebrationAction).mockResolvedValue(created as never);
    render(<CelebrationComposer {...common} places={[]} homeCountry="PE" />);
    await userEvent.type(screen.getByLabelText("Título"), "Año Nuevo");
    await userEvent.type(screen.getByLabelText("Texto"), "Empieza el año.");
    await userEvent.type(screen.getByLabelText(/^Fecha/), "2026-01-01");
    await userEvent.click(screen.getByRole("radio", { name: "Todo el mundo" }));
    expect(screen.queryByLabelText(/^Región/)).toBeNull();
    await saveDraft();
    expect(createCelebrationAction).toHaveBeenCalledWith(expect.objectContaining({ scopeCountry: null, scopeRegion: null }));
  });

  it("una fecha única con hora no deja terminar antes de empezar", async () => {
    render(<CelebrationComposer {...common} places={[]} homeCountry="PE" />);
    await userEvent.click(screen.getByRole("radio", { name: "Solo una vez" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Todo el día" }));
    expect(screen.queryByLabelText("Desde el año (opcional)")).toBeNull();
    await userEvent.type(screen.getByLabelText("Título"), "Eclipse");
    await userEvent.type(screen.getByLabelText("Texto"), "Se verá desde Ayacucho.");
    await userEvent.type(screen.getByLabelText(/^Empieza/), "2030-05-10T18:00");
    await userEvent.type(screen.getByLabelText("Termina (opcional)"), "2030-05-10T16:00");
    await saveDraft();
    expect(screen.getByLabelText("Termina (opcional)")).toHaveAccessibleDescription(/Termina antes de empezar/);
    expect(createCelebrationAction).not.toHaveBeenCalled();
  });

  it("recuerda la regla: si hubo pago o canje es un anuncio, no una fecha", () => {
    render(<CelebrationComposer {...common} places={[]} homeCountry="PE" />);
    expect(screen.getByText(/¿Te pagaron o te dieron algo a cambio/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Crear un anuncio/ })).toHaveAttribute("href", "/admin/anunciantes");
  });
});


describe("Compositor del Directorio", () => {
  it("valida correo y sitio web antes de guardar", async () => {
    const { container } = render(<BusinessComposer {...common} places={[]} />);
    await userEvent.type(screen.getByLabelText("Nombre"), "Café del Valle");
    await userEvent.type(screen.getByLabelText("Texto"), "Café de altura.");
    await userEvent.type(screen.getByLabelText("Correo"), "hola@");
    await userEvent.type(screen.getByLabelText("Sitio web"), "cafe.pe");
    await saveDraft();
    expect(screen.getByLabelText("Correo")).toHaveAccessibleDescription("Escribe un correo válido.");
    expect(screen.getByLabelText("Sitio web")).toHaveAccessibleDescription(/https:\/\//);
    expect(createBusinessAction).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  }, 15_000);
});
