// Biblioteca de imágenes (ImageAdminController).
import "server-only";
import type { AdminImage, ImagePurpose } from "../admin-types";
import { authedJson } from "./http";

/** Sin `purpose`, todas (página Imágenes); los selectores piden solo las suyas. */
export function listAdminImages(accessToken: string, purpose?: ImagePurpose): Promise<AdminImage[]> {
  return authedJson(`/api/v1/admin/images${purpose ? `?purpose=${purpose}` : ""}`, accessToken);
}

/**
 * `formData` debe traer un part "file" (el binario) y opcionalmente
 * "altText" y "purpose" (CONTENT por defecto). No se fija Content-Type a mano: fetch genera el boundary
 * multipart correcto solo si se lo deja decidir a él.
 */
export function uploadImage(accessToken: string, formData: FormData): Promise<AdminImage> {
  return authedJson("/api/v1/admin/images", accessToken, {
    method: "POST",
    body: formData,
  });
}

export function updateImageAltText(accessToken: string, id: string, altText: string): Promise<AdminImage> {
  return authedJson(`/api/v1/admin/images/${encodeURIComponent(id)}`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ altText }),
  });
}

export function deleteImage(accessToken: string, id: string): Promise<void> {
  return authedJson(`/api/v1/admin/images/${encodeURIComponent(id)}`, accessToken, { method: "DELETE" });
}
