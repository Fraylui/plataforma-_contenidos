import { canPublish } from "./permissions";
import type { Gallery, GalleryStatus } from "@/lib/api/types";
import type { AdminUser } from "@/lib/api/admin-types";

/**
 * Espeja las reglas de autorización de GalleryService (backend) — mismo
 * patrón que event-permissions.ts/place-permissions.ts, mismas reglas
 * (sección 12). Ver backend/src/main/java/.../galleries/GalleryService.java.
 */
export interface GalleryPermissions {
  canEdit: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canPublish: boolean;
  canSchedule: boolean;
  canArchive: boolean;
}

const EDITABLE_STATUSES: GalleryStatus[] = ["DRAFT", "IN_REVIEW", "APPROVED", "REJECTED"];

export function computeGalleryPermissions(gallery: Gallery, user: AdminUser): GalleryPermissions {
  const isEditorOrAbove = canPublish(user, "GALLERIES");
  const isOwner = gallery.authorId === user.id;

  const canEdit = isEditorOrAbove
    ? EDITABLE_STATUSES.includes(gallery.status)
    : isOwner && (gallery.status === "DRAFT" || gallery.status === "REJECTED");

  return {
    canEdit,
    canSubmit: isOwner && (gallery.status === "DRAFT" || gallery.status === "REJECTED"),
    canApprove: isEditorOrAbove && gallery.status === "IN_REVIEW",
    canReject: isEditorOrAbove && gallery.status === "IN_REVIEW",
    canPublish: isEditorOrAbove && gallery.status === "APPROVED",
    canSchedule: isEditorOrAbove && gallery.status === "APPROVED",
    canArchive: isEditorOrAbove && gallery.status === "PUBLISHED",
  };
}
