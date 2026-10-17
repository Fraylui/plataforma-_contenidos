import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCampaignAction } from "@/app/admin/(protected)/anunciantes/actions";
import type { AdvertiserIndustry } from "@/lib/api/admin-types";
import { CampaignForm } from "./campaign-form";

vi.mock("@/app/admin/(protected)/anunciantes/actions", () => ({
  createCampaignAction: vi.fn(async () => ({ ok: true })),
  updateCampaignAction: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@/app/admin/(protected)/imagenes/actions", () => ({ uploadImageInlineAction: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function renderForm(industry: AdvertiserIndustry = "GENERAL") {
  return render(
    <CampaignForm
      mode="create"
      advertiserId="adv-1"
      advertiserName="Pollería El Inca"
      advertiserLogoImageId={null}
      advertiserIndustry={industry}
      placements={[{ id: "p1", key: "lateral", label: "Lateral", adsenseSlotId: null, enabled: true, width: 300, height: 250 }]}
      categories={[]}
      allImages={[]}
    />,
  );
}

describe("CampaignForm — post en el feed", () => {
  beforeEach(() => vi.mocked(createCampaignAction).mockClear());

  it("arranca en «Post en el feed» y la vista previa muestra el anuncio mientras se escribe", async () => {
    renderForm();
    expect(screen.getByRole("radio", { name: "Post en el feed" })).toBeChecked();
    expect(screen.queryByText("Posición")).toBeNull();

    await userEvent.type(screen.getByLabelText("Texto del anuncio"), "2x1 los martes");
    const preview = screen.getByRole("complementary", { name: "Vista previa" });
    expect(within(preview).getByRole("article", { name: "Patrocinado: Pollería El Inca" })).toHaveTextContent("2x1 los martes");
  });

  it("con video de YouTube envía el formato nativo sin posición", async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText("Texto del anuncio"), "2x1 los martes");
    await userEvent.click(screen.getByRole("radio", { name: "Video de YouTube" }));
    await userEvent.type(screen.getByLabelText("Link del video de YouTube"), "https://youtu.be/dQw4w9WgXcQ");
    await userEvent.type(screen.getByLabelText(/Link de destino/), "https://wa.me/51999999999");
    expect(screen.getByRole("button", { name: "Crear campaña" })).toBeDisabled();
    await userEvent.click(screen.getByRole("checkbox", { name: /vigencia, el stock y las condiciones/ }));
    await userEvent.click(screen.getByRole("button", { name: "Crear campaña" }));

    expect(createCampaignAction).toHaveBeenCalledWith(
      "adv-1",
      expect.objectContaining({
        format: "NATIVE",
        placementKey: null,
        videoUrl: "https://youtu.be/dQw4w9WgXcQ",
        imageId: null,
        primaryText: "2x1 los martes",
        callToAction: "LEARN_MORE",
        complianceConfirmed: true,
      }),
    );
  });

  it("un anunciante de rubro regulado ve su advertencia obligatoria antes de guardar", () => {
    renderForm("ALCOHOL");
    expect(screen.getByRole("note")).toHaveTextContent("TOMAR BEBIDAS ALCOHÓLICAS EN EXCESO ES DAÑINO");
  });

  it("un rubro general no muestra advertencia", () => {
    renderForm();
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("un link que no es de YouTube no deja guardar", async () => {
    renderForm();
    await userEvent.type(screen.getByLabelText("Texto del anuncio"), "Hola");
    await userEvent.click(screen.getByRole("radio", { name: "Video de YouTube" }));
    await userEvent.type(screen.getByLabelText("Link del video de YouTube"), "https://vimeo.com/1");
    await userEvent.type(screen.getByLabelText(/Link de destino/), "https://tienda.example.com");
    expect(screen.getByText("Ese link no es de un video de YouTube.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear campaña" })).toBeDisabled();
  });

  it("«Banner» vuelve al formulario de posición, sin vista previa del post", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("radio", { name: "Banner" }));
    expect(screen.getByText("Posición")).toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "Vista previa" })).toBeNull();
  });
});
