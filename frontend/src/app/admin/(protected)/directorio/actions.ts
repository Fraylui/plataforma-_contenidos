"use server";

import { revalidatePath } from "next/cache";
import {
  createBusiness,
  updateBusiness,
} from "@/lib/api/admin-client";
import type { BusinessInput } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult, type MutationResult } from "@/lib/admin/action-helpers";

export type { ActionResult };

/** Crea el borrador y devuelve su id, sin redirigir (el compositor cambia la URL sin recargar). */
export async function createBusinessAction(input: BusinessInput): Promise<MutationResult<{ id: string }>> {
  const result = await runAdminMutation((token) => createBusiness(token, input));
  if (!result.ok) return result;
  revalidatePath("/admin/directorio");
  return { ok: true, data: { id: result.data.id } };
}

export async function updateBusinessAction(id: string, input: BusinessInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updateBusiness(token, id, input));
  if (result.ok) {
    revalidatePath("/admin/directorio");
    revalidatePath(`/admin/directorio/${id}`);
  }
  return result;
}

