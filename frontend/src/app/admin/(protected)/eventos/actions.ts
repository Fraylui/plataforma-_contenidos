"use server";

import { revalidatePath } from "next/cache";
import {
  createEvent,
  updateEvent,
} from "@/lib/api/admin-client";
import type { EventInput } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult, type MutationResult } from "@/lib/admin/action-helpers";

export type { ActionResult };

/** Crea el borrador y devuelve su id, sin redirigir (el compositor cambia la URL sin recargar). */
export async function createEventAction(input: EventInput): Promise<MutationResult<{ id: string }>> {
  const result = await runAdminMutation((token) => createEvent(token, input));
  if (!result.ok) return result;
  revalidatePath("/admin/eventos");
  return { ok: true, data: { id: result.data.id } };
}

export async function updateEventAction(id: string, input: EventInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updateEvent(token, id, input));
  if (result.ok) {
    revalidatePath("/admin/eventos");
    revalidatePath(`/admin/eventos/${id}`);
  }
  return result;
}

