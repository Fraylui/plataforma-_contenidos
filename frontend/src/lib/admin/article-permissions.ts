import type { Article, ArticleStatus } from "@/lib/api/types";
import type { AdminUser } from "@/lib/api/admin-types";

/**
 * Espeja las reglas de autorización de ArticleService (backend) para decidir
 * qué mostrar en la UI. El backend es la autoridad real (rechaza con 403/409
 * si algo se intenta igual) — esto es solo para no mostrar botones que van a
 * fallar seguro. Ver backend/src/main/java/.../content/ArticleService.java.
 */
export interface ArticlePermissions {
  canEdit: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canPublish: boolean;
  canSchedule: boolean;
  canArchive: boolean;
}

const EDITOR_OR_ABOVE: Array<AdminUser["role"]> = ["SUPER_ADMIN", "ADMIN", "EDITOR"];
const EDITABLE_STATUSES: ArticleStatus[] = ["DRAFT", "IN_REVIEW", "APPROVED", "REJECTED"];

export function computeArticlePermissions(article: Article, user: AdminUser): ArticlePermissions {
  const isEditorOrAbove = EDITOR_OR_ABOVE.includes(user.role);
  const isOwner = article.authorId === user.id;

  const canEdit = isEditorOrAbove
    ? EDITABLE_STATUSES.includes(article.status)
    : isOwner && (article.status === "DRAFT" || article.status === "REJECTED");

  return {
    canEdit,
    // submit no requiere EDITOR+: cualquier autor envía SU PROPIO borrador a revisión.
    canSubmit: isOwner && (article.status === "DRAFT" || article.status === "REJECTED"),
    canApprove: isEditorOrAbove && article.status === "IN_REVIEW",
    canReject: isEditorOrAbove && article.status === "IN_REVIEW",
    canPublish: isEditorOrAbove && article.status === "APPROVED",
    canSchedule: isEditorOrAbove && article.status === "APPROVED",
    canArchive: isEditorOrAbove && article.status === "PUBLISHED",
  };
}
