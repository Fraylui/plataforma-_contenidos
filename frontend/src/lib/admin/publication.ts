import { canPublish } from "./permissions";
import type { PublicationStatus } from "@/lib/api/types";
import type { AdminUser, Module } from "@/lib/api/admin-types";

/** Los 5 tipos de contenido comparten el flujo de publicación (backend: shared.publishing). */
export type PublicationKind = "articles" | "places" | "events" | "galleries" | "directory";

/** Pasos del flujo; cada uno es POST /api/v1/admin/{tipo}/{id}/{paso}. */
export type PublicationStep = "submit" | "publish" | "schedule" | "return-to-draft" | "archive";

export const PUBLICATION_STEPS: readonly PublicationStep[] = ["submit", "publish", "schedule", "return-to-draft", "archive"];

export const PUBLICATION_KINDS: Record<PublicationKind, { adminPath: string; module: Module; noun: string }> = {
  articles: { adminPath: "/admin/publicaciones", module: "ARTICLES", noun: "publicación" },
  places: { adminPath: "/admin/lugares", module: "PLACES", noun: "lugar" },
  events: { adminPath: "/admin/eventos", module: "EVENTS", noun: "evento" },
  galleries: { adminPath: "/admin/galerias", module: "GALLERIES", noun: "galería" },
  directory: { adminPath: "/admin/directorio", module: "DIRECTORY", noun: "ficha del directorio" },
};

export function isPublicationKind(value: string): value is PublicationKind {
  return Object.hasOwn(PUBLICATION_KINDS, value);
}

export interface PublicationPermissions {
  canEdit: boolean;
  canSubmit: boolean;
  canPublish: boolean;
  canSchedule: boolean;
  canReturnToDraft: boolean;
  canArchive: boolean;
}

const PUBLISHABLE: PublicationStatus[] = ["DRAFT", "IN_REVIEW", "SCHEDULED"];

/**
 * Qué botones mostrar. Espeja PublishableContent y los servicios del backend,
 * que son la autoridad (rechazan con 403/409 lo que no corresponde).
 */
export function computePublicationPermissions(
  item: { status: PublicationStatus; authorId: string },
  user: AdminUser,
  kind: PublicationKind,
): PublicationPermissions {
  const publisher = canPublish(user, PUBLICATION_KINDS[kind].module);
  const mine = item.authorId === user.id;
  return {
    canEdit: publisher ? item.status !== "ARCHIVED" : mine && item.status === "DRAFT",
    // Quien publica no "envía para aprobar": publica directo.
    canSubmit: !publisher && mine && item.status === "DRAFT",
    canPublish: publisher && PUBLISHABLE.includes(item.status),
    canSchedule: publisher && PUBLISHABLE.includes(item.status),
    canReturnToDraft: publisher && (item.status === "IN_REVIEW" || item.status === "SCHEDULED"),
    canArchive: publisher && item.status === "PUBLISHED",
  };
}
