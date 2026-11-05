"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPlace, getAdminPlace, updatePlace } from "@/lib/api/admin/content";
import { placeCopy } from "@/lib/admin/duplicate";
import type { PlaceInput } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult, type MutationResult } from "@/lib/admin/action-helpers";

export type { ActionResult };

/** Crea el borrador y devuelve su id, sin redirigir (el compositor cambia la URL sin recargar). */
export async function createPlaceAction(input: PlaceInput): Promise<MutationResult<{ id: string }>> {
  const result = await runAdminMutation((token) => createPlace(token, input));
  if (!result.ok) return result;
  revalidatePath("/admin/lugares");
  return { ok: true, data: { id: result.data.id } };
}

export async function updatePlaceAction(id: string, input: PlaceInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updatePlace(token, id, input));
  if (result.ok) {
    revalidatePath("/admin/lugares");
    revalidatePath(`/admin/lugares/${id}`);
  }
  return result;
}


/**
 * «Duplicar»: crea un borrador nuevo con todo lo del original y abre su
 * edición. Si falla, devuelve el error para mostrarlo junto al botón.
 */
export async function duplicatePlaceAction(id: string): Promise<ActionResult> {
  const result = await runAdminMutation(async (token) => createPlace(token, placeCopy(await getAdminPlace(token, id))));
  if (!result.ok) return result;
  revalidatePath("/admin/lugares");
  redirect(`/admin/lugares/${result.data.id}`);
}
