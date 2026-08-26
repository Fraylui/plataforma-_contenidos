"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { activateUser, createUser, deactivateUser } from "@/lib/api/admin-client";
import type { CreateUserInput } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult } from "@/lib/admin/action-helpers";

export type { ActionResult };

export async function createUserAction(input: CreateUserInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => createUser(token, input));
  if (!result.ok) return result;
  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

/**
 * Botón de activar/desactivar en la lista: form simple sin JS (progressive
 * enhancement) — por eso no puede devolver un ActionResult. Un error real
 * (ej. "no puedes desactivar tu propia cuenta", "solo un SUPER_ADMIN
 * gestiona SUPER_ADMIN" — ver UserAdminService) se relanza con el mensaje
 * del backend en vez de tragárselo.
 */
export async function setUserActiveAction(id: string, active: boolean): Promise<void> {
  const result = await runAdminMutation((token) => (active ? activateUser(token, id) : deactivateUser(token, id)));
  if (!result.ok) {
    throw new Error(result.error);
  }
  revalidatePath("/admin/usuarios");
}
