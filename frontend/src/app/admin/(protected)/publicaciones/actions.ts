"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPublication, getAdminPublication, updatePublication } from "@/lib/api/admin/content";
import { publicationCopy } from "@/lib/admin/duplicate";
import type { PublicationInput } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult, type MutationResult } from "@/lib/admin/action-helpers";

export type { ActionResult };

/**
 * Crea el borrador y devuelve su id, sin redirigir: el compositor lo crea
 * con el guardado automático mientras se escribe y solo cambia la URL.
 */
export async function createPublicationAction(input: PublicationInput): Promise<MutationResult<{ id: string }>> {
  const result = await runAdminMutation((token) => createPublication(token, input));
  if (!result.ok) return result;
  revalidatePath("/admin/publicaciones");
  return { ok: true, data: { id: result.data.id } };
}

export async function updatePublicationAction(id: string, input: PublicationInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updatePublication(token, id, input));
  if (result.ok) {
    revalidatePath("/admin/publicaciones");
    revalidatePath(`/admin/publicaciones/${id}`);
  }
  return result;
}


/**
 * «Duplicar»: crea un borrador nuevo con todo lo del original y abre su
 * edición. Si falla, devuelve el error para mostrarlo junto al botón.
 */
export async function duplicatePublicationAction(id: string): Promise<ActionResult> {
  const result = await runAdminMutation(async (token) => createPublication(token, publicationCopy(await getAdminPublication(token, id))));
  if (!result.ok) return result;
  revalidatePath("/admin/publicaciones");
  redirect(`/admin/publicaciones/${result.data.id}`);
}
