import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AuditEvent } from "@/lib/api/admin-types";
import { AuditTimeline } from "./audit-timeline";

function event(overrides: Partial<AuditEvent>): AuditEvent {
  return {
    id: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    actorUserId: null,
    actorEmail: "duena@ejemplo.pe",
    action: "EVENT_PUBLISHED",
    resourceType: "event",
    resourceId: null,
    ipAddress: "203.0.113.5",
    result: "SUCCESS",
    details: null,
    ...overrides,
  };
}

describe("AuditTimeline", () => {
  it("muestra cada acción en español, agrupada por día", () => {
    render(<AuditTimeline events={[event({}), event({ action: "LOGIN_FAILURE", result: "FAILURE", actorEmail: null })]} />);

    expect(screen.getByText("Hoy")).toBeInTheDocument();
    expect(screen.getByText("Publicó una celebración")).toBeInTheDocument();
    expect(screen.getByText("Intento de inicio de sesión fallido")).toBeInTheDocument();
    expect(screen.getByText("Sistema")).toBeInTheDocument();
    // Compacto (inicio): sin IP ni detalle.
    expect(screen.queryByText("203.0.113.5")).not.toBeInTheDocument();
  });

  it("en detalle muestra recurso, IP, fallo y el antes → después", () => {
    render(
      <AuditTimeline
        detailed
        events={[
          event({ action: "WORKER_PERMISSIONS_CHANGED", resourceType: "worker", details: "PUBLICATIONS: CREATE → PUBLISH" }),
          event({ action: "LOGIN_FAILURE", result: "FAILURE" }),
        ]}
      />,
    );

    expect(screen.getByText(/Trabajador/)).toBeInTheDocument();
    expect(screen.getAllByText("203.0.113.5")).toHaveLength(2);
    expect(screen.getByText("Fallo")).toBeInTheDocument();
    expect(screen.getByText("Ver cambios")).toBeInTheDocument();
    expect(screen.getByText("Publicaciones:")).toBeInTheDocument();
    expect(screen.getByText("Crear")).toBeInTheDocument();
    expect(screen.getByText("Publicar")).toBeInTheDocument();
  });
});
