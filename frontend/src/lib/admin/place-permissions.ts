import { canPublish } from "./permissions";
import type { Place, PlaceStatus } from "@/lib/api/types";
import type { AdminUser } from "@/lib/api/admin-types";

/**
 * Espeja las reglas de autorización de PlaceService (backend) — mismo
 * patrón que article-permissions.ts, mismas reglas (sección 12), estado
 * por estado idéntico a Article. Ver
 * backend/src/main/java/.../places/PlaceService.java.
 */
export interface PlacePermissions {
  canEdit: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canPublish: boolean;
  canSchedule: boolean;
  canArchive: boolean;
}

const EDITABLE_STATUSES: PlaceStatus[] = ["DRAFT", "IN_REVIEW", "APPROVED", "REJECTED"];

export function computePlacePermissions(place: Place, user: AdminUser): PlacePermissions {
  const isEditorOrAbove = canPublish(user, "PLACES");
  const isOwner = place.authorId === user.id;

  const canEdit = isEditorOrAbove
    ? EDITABLE_STATUSES.includes(place.status)
    : isOwner && (place.status === "DRAFT" || place.status === "REJECTED");

  return {
    canEdit,
    canSubmit: isOwner && (place.status === "DRAFT" || place.status === "REJECTED"),
    canApprove: isEditorOrAbove && place.status === "IN_REVIEW",
    canReject: isEditorOrAbove && place.status === "IN_REVIEW",
    canPublish: isEditorOrAbove && place.status === "APPROVED",
    canSchedule: isEditorOrAbove && place.status === "APPROVED",
    canArchive: isEditorOrAbove && place.status === "PUBLISHED",
  };
}
