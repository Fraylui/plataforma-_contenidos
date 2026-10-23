"use server";

import { revalidatePath } from "next/cache";
import { createPublication, updatePublication } from "@/lib/api/admin/content";
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

