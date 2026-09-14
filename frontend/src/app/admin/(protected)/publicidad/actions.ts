"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  activateAdPlacement,
  createAdPlacement,
  deactivateAdPlacement,
  deleteAdPlacement,
  updateAdPlacement,
} from "@/lib/api/admin-client";
import type { AdPlacementCreateInput, AdPlacementUpdateInput } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult } from "@/lib/admin/action-helpers";

export type { ActionResult };

export async function createAdPlacementAction(input: AdPlacementCreateInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => createAdPlacement(token, input));
  if (!result.ok) return result;
  revalidatePath("/admin/publicidad");
  redirect("/admin/publicidad");
}

export async function updateAdPlacementAction(id: string, input: AdPlacementUpdateInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updateAdPlacement(token, id, input));
  if (result.ok) {
    revalidatePath("/admin/publicidad");
    revalidatePath(`/admin/publicidad/${id}`);
  }
  return result;
}

/** Botón de activar/desactivar en la lista: form simple sin JS, mismo patrón que categorías. */
export async function setAdPlacementActiveAction(id: string, active: boolean): Promise<void> {
  const result = await runAdminMutation((token) =>
    active ? activateAdPlacement(token, id) : deactivateAdPlacement(token, id),
  );
  if (!result.ok) {
    throw new Error(result.error);
  }
  revalidatePath("/admin/publicidad");
}

/**
 * A diferencia de categorías, una posición de anuncio no queda referenciada
 * por contenido publicado — borrar de verdad (no solo desactivar) es seguro.
 */
export async function deleteAdPlacementAction(id: string): Promise<void> {
  const result = await runAdminMutation((token) => deleteAdPlacement(token, id));
  if (!result.ok) {
    throw new Error(result.error);
  }
  revalidatePath("/admin/publicidad");
}
