"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createGallery, getAdminGallery, updateGallery } from "@/lib/api/admin/content";
import { galleryCopy } from "@/lib/admin/duplicate";
import type { GalleryInput } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult, type MutationResult } from "@/lib/admin/action-helpers";

export type { ActionResult };

/** Crea el borrador y devuelve su id, sin redirigir (el compositor cambia la URL sin recargar). */
export async function createGalleryAction(input: GalleryInput): Promise<MutationResult<{ id: string }>> {
  const result = await runAdminMutation((token) => createGallery(token, input));
  if (!result.ok) return result;
  revalidatePath("/admin/galerias");
  return { ok: true, data: { id: result.data.id } };
}

export async function updateGalleryAction(id: string, input: GalleryInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updateGallery(token, id, input));
  if (result.ok) {
    revalidatePath("/admin/galerias");
    revalidatePath(`/admin/galerias/${id}`);
  }
  return result;
}


/**
 * «Duplicar»: crea un borrador nuevo con todo lo del original y abre su
 * edición. Si falla, devuelve el error para mostrarlo junto al botón.
 */
export async function duplicateGalleryAction(id: string): Promise<ActionResult> {
  const result = await runAdminMutation(async (token) => createGallery(token, galleryCopy(await getAdminGallery(token, id))));
  if (!result.ok) return result;
  revalidatePath("/admin/galerias");
  redirect(`/admin/galerias/${result.data.id}`);
}
