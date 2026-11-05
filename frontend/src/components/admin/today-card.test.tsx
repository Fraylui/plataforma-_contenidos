import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TodayCard } from "./today-card";

describe("Qué hacer hoy", () => {
  it("muestra fechas que se acercan, lo que sale hoy y los borradores para retomar", () => {
    render(
      <TodayCard
        canCreatePublication
        data={{
          today: "2026-10-26",
          upcomingDates: [{ kind: "CELEBRATION_DATE", type: "CELEBRATION", id: "c1", title: "Día de la Canción Criolla", status: "PUBLISHED", date: "2026-10-31", time: null }],
          scheduledToday: [{ kind: "SCHEDULED", type: "GALLERY", id: "g1", title: "Atardeceres en Paracas", status: "SCHEDULED", date: "2026-10-26", time: "18:30" }],
          drafts: [{ type: "PUBLICATION", id: "p1", title: "Rutas en bicicleta", updatedAt: "2026-10-25T10:00:00Z" }],
        }}
      />,
    );
    expect(screen.getByText("En 5 días")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crear una publicación para esta fecha" })).toHaveAttribute("href", "/admin/publicaciones/nuevo");
    expect(screen.getByRole("link", { name: /18:30 Atardeceres en Paracas/ })).toHaveAttribute("href", "/admin/galerias/g1");
    expect(screen.getByRole("link", { name: /Rutas en bicicleta/ })).toHaveAttribute("href", "/admin/publicaciones/p1");
  });

  it("sin pendientes invita a crear", () => {
    render(<TodayCard canCreatePublication={false} data={{ today: "2026-10-26", upcomingDates: [], scheduledToday: [], drafts: [] }} />);
    expect(screen.getByText(/Nada pendiente/)).toBeInTheDocument();
  });
});
