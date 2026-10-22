"use server";

import { revalidatePath } from "next/cache";
import { createLive, runLiveStep, updateLive, type LiveStep } from "@/lib/api/admin/live";
import type { LiveInput } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult, type MutationResult } from "@/lib/admin/action-helpers";

const STEPS: readonly LiveStep[] = ["start", "end", "cancel"];

/** El panel se refresca; lo público (aviso del inicio, /en-vivo) ya lo invalida runAdminMutation. */
function refresh(id?: string) {
  revalidatePath("/admin/en-vivo");
  if (id) revalidatePath(`/admin/en-vivo/${id}`);
}

export async function createLiveAction(input: LiveInput): Promise<MutationResult<{ id: string }>> {
  const result = await runAdminMutation((token) => createLive(token, input));
  if (!result.ok) return result;
  refresh();
  return { ok: true, data: { id: result.data.id } };
}

export async function updateLiveAction(id: string, input: LiveInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updateLive(token, id, input));
  if (result.ok) refresh(id);
  return result;
}

/** Estamos en vivo / Terminar / Cancelar. El paso llega del navegador: se valida contra la lista cerrada. */
export async function liveStepAction(id: string, step: LiveStep): Promise<ActionResult> {
  if (!STEPS.includes(step)) return { ok: false, error: "Acción no válida." };
  const result = await runAdminMutation((token) => runLiveStep(token, id, step));
  if (result.ok) refresh(id);
  return result.ok ? { ok: true } : result;
}
