import { canAccess } from "./permissions";
import type { PublicationStatus } from "@/lib/api/types";
import type { AdminUser, Module } from "@/lib/api/admin-types";

/** Los 5 tipos de contenido comparten el flujo de publicación (backend: shared.publishing). */
export type PublicationKind = "publications" | "places" | "celebrations" | "galleries" | "series";

/** Pasos del flujo; cada uno es POST /api/v1/admin/{tipo}/{id}/{paso}. */
export type PublicationStep = "publish" | "schedule" | "return-to-draft" | "archive";

export const PUBLICATION_STEPS: readonly PublicationStep[] = ["publish", "schedule", "return-to-draft", "archive"];

export const PUBLICATION_KINDS: Record<PublicationKind, { adminPath: string; module: Module; noun: string }> = {
  publications: { adminPath: "/admin/publicaciones", module: "PUBLICATIONS", noun: "publicación" },
  places: { adminPath: "/admin/lugares", module: "PLACES", noun: "lugar" },
  celebrations: { adminPath: "/admin/celebraciones", module: "CELEBRATIONS", noun: "celebracion" },
  galleries: { adminPath: "/admin/galerias", module: "GALLERIES", noun: "galería" },
  series: { adminPath: "/admin/series", module: "SERIES", noun: "serie" },
};

export function isPublicationKind(value: string): value is PublicationKind {
  return Object.hasOwn(PUBLICATION_KINDS, value);
}

export interface PublicationPermissions {
  canEdit: boolean;
  canPublish: boolean;
  canSchedule: boolean;
  canReturnToDraft: boolean;
  canArchive: boolean;
}

const PUBLISHABLE: PublicationStatus[] = ["DRAFT", "SCHEDULED"];

/**
 * Qué botones mostrar. Espeja PublishableContent y los servicios del backend,
 * que son la autoridad (rechazan con 403/409 lo que no corresponde).
 */
export function computePublicationPermissions(
  item: { status: PublicationStatus },
  user: AdminUser,
  kind: PublicationKind,
): PublicationPermissions {
  // Tener el módulo es publicar en él: sin paso de aprobación (V54).
  const member = canAccess(user, PUBLICATION_KINDS[kind].module);
  return {
    canEdit: member && item.status !== "ARCHIVED",
    canPublish: member && PUBLISHABLE.includes(item.status),
    canSchedule: member && PUBLISHABLE.includes(item.status),
    canReturnToDraft: member && item.status === "SCHEDULED",
    canArchive: member && item.status === "PUBLISHED",
  };
}
