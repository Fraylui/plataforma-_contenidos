"use server";

import { revalidatePath } from "next/cache";
import { deleteImage, updateImageAltText, uploadImage } from "@/lib/api/admin-client";
import type { AdminImage } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult, type MutationResult } from "@/lib/admin/action-helpers";

export type { ActionResult };

export async function uploadImageAction(formData: FormData): Promise<ActionResult> {
  const result = await runAdminMutation((token) => uploadImage(token, formData));
  if (result.ok) revalidatePath("/admin/medios");
  return result;
}

/**
 * Igual que uploadImageAction pero devuelve la imagen creada: para subir una
 * foto "al vuelo" desde el selector de un formulario de contenido
 * (Artículo/Lugar/Evento/...) sin obligar a pasar antes por /admin/medios.
 */
export async function uploadImageInlineAction(formData: FormData): Promise<MutationResult<AdminImage>> {
  const result = await runAdminMutation((token) => uploadImage(token, formData));
  if (result.ok) revalidatePath("/admin/medios");
  return result;
}

export async function updateImageAltTextAction(id: string, altText: string): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updateImageAltText(token, id, altText));
  if (result.ok) revalidatePath("/admin/medios");
  return result;
}

export async function deleteImageAction(id: string): Promise<ActionResult> {
  const result = await runAdminMutation((token) => deleteImage(token, id));
  if (result.ok) revalidatePath("/admin/medios");
  return result;
}
