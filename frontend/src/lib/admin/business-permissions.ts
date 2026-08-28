import type { Business, BusinessStatus } from "@/lib/api/types";
import type { AdminUser } from "@/lib/api/admin-types";

/**
 * Espeja las reglas de autorización de BusinessService (backend) — mismo
 * patrón que review-permissions.ts/event-permissions.ts, mismas reglas
 * (sección 12). Ver backend/src/main/java/.../directory/BusinessService.java.
 */
export interface BusinessPermissions {
  canEdit: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canPublish: boolean;
  canSchedule: boolean;
  canArchive: boolean;
}

const EDITOR_OR_ABOVE: Array<AdminUser["role"]> = ["SUPER_ADMIN", "ADMIN", "EDITOR"];
const EDITABLE_STATUSES: BusinessStatus[] = ["DRAFT", "IN_REVIEW", "APPROVED", "REJECTED"];

export function computeBusinessPermissions(business: Business, user: AdminUser): BusinessPermissions {
  const isEditorOrAbove = EDITOR_OR_ABOVE.includes(user.role);
  const isOwner = business.authorId === user.id;

  const canEdit = isEditorOrAbove
    ? EDITABLE_STATUSES.includes(business.status)
    : isOwner && (business.status === "DRAFT" || business.status === "REJECTED");

  return {
    canEdit,
    canSubmit: isOwner && (business.status === "DRAFT" || business.status === "REJECTED"),
    canApprove: isEditorOrAbove && business.status === "IN_REVIEW",
    canReject: isEditorOrAbove && business.status === "IN_REVIEW",
    canPublish: isEditorOrAbove && business.status === "APPROVED",
    canSchedule: isEditorOrAbove && business.status === "APPROVED",
    canArchive: isEditorOrAbove && business.status === "PUBLISHED",
  };
}
