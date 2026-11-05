import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const save = vi.hoisted(() => vi.fn());
vi.mock("@/app/admin/(protected)/afiliados/actions", () => ({ saveAffiliateLinksAction: save }));

import { AffiliateLinksEditor, affiliateRowError } from "./affiliate-links-editor";

describe("editor de enlaces de afiliado", () => {
  it("valida igual que el servidor", () => {
    expect(affiliateRowError({ label: "Tour", url: "https://civitatis.com/x" })).toBeNull();
    expect(affiliateRowError({ label: " ", url: "https://civitatis.com/x" })).toMatch(/nombre/);
    expect(affiliateRowError({ label: "Tour", url: "http://civitatis.com" })).toMatch(/https/);
    expect(affiliateRowError({ label: "Tour", url: "https://localhost" })).toMatch(/https/);
  });

  it("muestra los clics, no guarda si un enlace está mal y guarda en orden", async () => {
    save.mockResolvedValue({ ok: true, data: [] });
    render(
      <AffiliateLinksEditor
        type="PLACE"
        contentId="lugar-1"
        initialLinks={[{ id: "a", position: 0, label: "Tour a Kuélap", url: "https://civitatis.com/kuelap", clicks: 12 }]}
      />,
    );
    expect(screen.getByText("12 clics")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Agregar enlace" }));
    await userEvent.click(screen.getByRole("button", { name: "Guardar enlaces" }));
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Revisa los enlaces marcados.");

    const names = screen.getAllByLabelText("Nombre");
    const urls = screen.getAllByLabelText("Enlace");
    await userEvent.type(names[1], "Hotel cerca");
    await userEvent.type(urls[1], "https://booking.com/h");
    await userEvent.click(screen.getAllByRole("button", { name: "Subir" })[1]);
    await userEvent.click(screen.getByRole("button", { name: "Guardar enlaces" }));
    expect(save).toHaveBeenCalledWith("PLACE", "lugar-1", [
      { label: "Hotel cerca", url: "https://booking.com/h" },
      { label: "Tour a Kuélap", url: "https://civitatis.com/kuelap" },
    ]);
  });
});
