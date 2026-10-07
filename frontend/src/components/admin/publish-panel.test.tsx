import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { formatEventDateTime } from "@/lib/content-labels";
import type { PublicationPermissions } from "@/lib/admin/publication";
import type { PublicationStatus } from "@/lib/api/types";
import { PublishPanel } from "./publish-panel";
import { publicationStepAction } from "@/app/admin/(protected)/publication-actions";

vi.mock("@/app/admin/(protected)/publication-actions", () => ({
  publicationStepAction: vi.fn().mockResolvedValue({ ok: true }),
}));

const NONE: PublicationPermissions = {
  canEdit: false,
  canSubmit: false,
  canPublish: false,
  canSchedule: false,
  canReturnToDraft: false,
  canArchive: false,
};

function renderPanel(
  status: PublicationStatus,
  permissions: Partial<PublicationPermissions>,
  extra: Partial<Parameters<typeof PublishPanel>[0]> = {},
) {
  const onSave = vi.fn().mockResolvedValue("item-1");
  const utils = render(
    <PublishPanel
      kind="articles"
      item={{ id: "item-1", status, scheduledAt: null, reviewNote: null }}
      permissions={{ ...NONE, ...permissions }}
      dirty={false}
      saving={false}
      onSave={onSave}
      {...extra}
    />,
  );
  return { ...utils, onSave };
}

describe("PublishPanel", () => {
  it("quien crea: «Enviar para aprobar» y guardar, sin publicar", async () => {
    const { container } = renderPanel("DRAFT", { canEdit: true, canSubmit: true });
    expect(screen.getByRole("button", { name: "Enviar para aprobar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar borrador" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Publicar" })).not.toBeInTheDocument();
    expect(screen.getByText("Borrador")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("quien publica: «Publicar» como acción principal, con programar y guardar", () => {
    renderPanel("DRAFT", { canEdit: true, canPublish: true, canSchedule: true });
    expect(screen.getByRole("button", { name: "Publicar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Programar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar borrador" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enviar para aprobar" })).not.toBeInTheDocument();
  });

  it("pendiente para quien publica: publicar o devolver con nota", async () => {
    renderPanel("IN_REVIEW", { canEdit: true, canPublish: true, canSchedule: true, canReturnToDraft: true });
    expect(screen.getByText("Pendiente de aprobación")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Devolver a borrador" }));
    await userEvent.type(screen.getByLabelText("Nota para quien lo creó (opcional)"), "Falta la portada");
    await userEvent.click(screen.getByRole("button", { name: "Devolver" }));
    expect(publicationStepAction).toHaveBeenCalledWith("articles", "item-1", "return-to-draft", { note: "Falta la portada" });
  });

  it("programado: muestra la fecha absoluta, publicar ahora o quitar la programación", async () => {
    const when = "2026-12-12T19:00:00Z";
    renderPanel(
      "SCHEDULED",
      { canEdit: true, canPublish: true, canSchedule: true, canReturnToDraft: true },
      { item: { id: "item-1", status: "SCHEDULED", scheduledAt: when, reviewNote: null } },
    );
    expect(screen.getByText(`Se publicará ${formatEventDateTime(when)}`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publicar ahora" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Quitar programación" }));
    expect(publicationStepAction).toHaveBeenCalledWith("articles", "item-1", "return-to-draft", undefined);
  });

  it("publicado: guardar cambios y archivar", () => {
    renderPanel("PUBLISHED", { canEdit: true, canArchive: true });
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Archivar" })).toBeInTheDocument();
  });

  it("la nota de devolución se ve en el borrador", () => {
    renderPanel("DRAFT", { canEdit: true, canSubmit: true }, {
      item: { id: "item-1", status: "DRAFT", scheduledAt: null, reviewNote: "Agrega una foto de portada" },
    });
    expect(screen.getByRole("note")).toHaveTextContent("Agrega una foto de portada");
  });

  it("con cambios sin guardar, publicar guarda primero y publica lo guardado", async () => {
    const { onSave } = renderPanel("DRAFT", { canEdit: true, canPublish: true, canSchedule: true }, { dirty: true });
    await userEvent.click(screen.getByRole("button", { name: "Publicar" }));
    expect(onSave).toHaveBeenCalledOnce();
    expect(publicationStepAction).toHaveBeenCalledWith("articles", "item-1", "publish", undefined);
  });

  it("algo nuevo aún sin guardar: publicar lo crea primero aunque no haya cambios", async () => {
    const onSave = vi.fn().mockResolvedValue("nuevo-1");
    renderPanel("DRAFT", { canEdit: true, canPublish: true }, {
      item: { id: "", status: "DRAFT", scheduledAt: null, reviewNote: null },
      onSave,
    });
    await userEvent.click(screen.getByRole("button", { name: "Publicar" }));
    expect(onSave).toHaveBeenCalledOnce();
    expect(publicationStepAction).toHaveBeenCalledWith("articles", "nuevo-1", "publish", undefined);
  });

  it("si guardar falla, no publica", async () => {
    const onSave = vi.fn().mockResolvedValue(null);
    renderPanel("DRAFT", { canEdit: true, canPublish: true }, { dirty: true, onSave });
    await userEvent.click(screen.getByRole("button", { name: "Publicar" }));
    expect(publicationStepAction).not.toHaveBeenCalled();
  });

  it("programar pide una fecha y la envía en ISO", async () => {
    renderPanel("DRAFT", { canEdit: true, canPublish: true, canSchedule: true });
    await userEvent.click(screen.getByRole("button", { name: "Programar" }));
    const input = screen.getByLabelText("Fecha y hora de publicación");
    await userEvent.type(input, "2030-01-15T10:30");
    await userEvent.click(screen.getByRole("button", { name: "Confirmar programación" }));
    expect(publicationStepAction).toHaveBeenCalledWith("articles", "item-1", "schedule", {
      scheduledAt: new Date("2030-01-15T10:30").toISOString(),
    });
  });
});
