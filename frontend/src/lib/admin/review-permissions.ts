import type { Review, ReviewStatus } from "@/lib/api/types";
import type { AdminUser } from "@/lib/api/admin-types";

/**
 * Espeja las reglas de autorización de ReviewService (backend) — mismo
 * patrón que event-permissions.ts/place-permissions.ts, mismas reglas
 * (sección 12). Ver backend/src/main/java/.../reviews/ReviewService.java.
 */
export interface ReviewPermissions {
  canEdit: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canPublish: boolean;
  canSchedule: boolean;
  canArchive: boolean;
}

const EDITOR_OR_ABOVE: Array<AdminUser["role"]> = ["SUPER_ADMIN", "ADMIN", "EDITOR"];
const EDITABLE_STATUSES: ReviewStatus[] = ["DRAFT", "IN_REVIEW", "APPROVED", "REJECTED"];

export function computeReviewPermissions(review: Review, user: AdminUser): ReviewPermissions {
  const isEditorOrAbove = EDITOR_OR_ABOVE.includes(user.role);
  const isOwner = review.authorId === user.id;

  const canEdit = isEditorOrAbove
    ? EDITABLE_STATUSES.includes(review.status)
    : isOwner && (review.status === "DRAFT" || review.status === "REJECTED");

  return {
    canEdit,
    canSubmit: isOwner && (review.status === "DRAFT" || review.status === "REJECTED"),
    canApprove: isEditorOrAbove && review.status === "IN_REVIEW",
    canReject: isEditorOrAbove && review.status === "IN_REVIEW",
    canPublish: isEditorOrAbove && review.status === "APPROVED",
    canSchedule: isEditorOrAbove && review.status === "APPROVED",
    canArchive: isEditorOrAbove && review.status === "PUBLISHED",
  };
}
