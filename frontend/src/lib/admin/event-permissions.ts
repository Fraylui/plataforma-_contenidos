import type { Event, EventStatus } from "@/lib/api/types";
import type { AdminUser } from "@/lib/api/admin-types";

/**
 * Espeja las reglas de autorización de EventService (backend) — mismo
 * patrón que place-permissions.ts, mismas reglas (sección 12), estado por
 * estado idéntico a Article/Place. Ver
 * backend/src/main/java/.../events/EventService.java.
 */
export interface EventPermissions {
  canEdit: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canPublish: boolean;
  canSchedule: boolean;
  canArchive: boolean;
}

const EDITOR_OR_ABOVE: Array<AdminUser["role"]> = ["SUPER_ADMIN", "ADMIN", "EDITOR"];
const EDITABLE_STATUSES: EventStatus[] = ["DRAFT", "IN_REVIEW", "APPROVED", "REJECTED"];

export function computeEventPermissions(event: Event, user: AdminUser): EventPermissions {
  const isEditorOrAbove = EDITOR_OR_ABOVE.includes(user.role);
  const isOwner = event.authorId === user.id;

  const canEdit = isEditorOrAbove
    ? EDITABLE_STATUSES.includes(event.status)
    : isOwner && (event.status === "DRAFT" || event.status === "REJECTED");

  return {
    canEdit,
    canSubmit: isOwner && (event.status === "DRAFT" || event.status === "REJECTED"),
    canApprove: isEditorOrAbove && event.status === "IN_REVIEW",
    canReject: isEditorOrAbove && event.status === "IN_REVIEW",
    canPublish: isEditorOrAbove && event.status === "APPROVED",
    canSchedule: isEditorOrAbove && event.status === "APPROVED",
    canArchive: isEditorOrAbove && event.status === "PUBLISHED",
  };
}
