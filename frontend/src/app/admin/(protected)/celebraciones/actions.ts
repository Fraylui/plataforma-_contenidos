"use server";

import { revalidatePath } from "next/cache";
import {
  createCelebration,
  updateCelebration,
} from "@/lib/api/admin-client";
import type { CelebrationInput } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult, type MutationResult } from "@/lib/admin/action-helpers";

export type { ActionResult };

/** Crea el borrador y devuelve su id, sin redirigir (el compositor cambia la URL sin recargar). */
export async function createCelebrationAction(input: CelebrationInput): Promise<MutationResult<{ id: string }>> {
  const result = await runAdminMutation((token) => createCelebration(token, input));
  if (!result.ok) return result;
  revalidatePath("/admin/celebraciones");
  return { ok: true, data: { id: result.data.id } };
}

export async function updateCelebrationAction(id: string, input: CelebrationInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updateCelebration(token, id, input));
  if (result.ok) {
    revalidatePath("/admin/celebraciones");
    revalidatePath(`/admin/celebraciones/${id}`);
  }
  return result;
}

