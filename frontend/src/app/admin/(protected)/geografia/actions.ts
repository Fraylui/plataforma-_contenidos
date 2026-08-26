"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { activateGeography, createGeography, deactivateGeography, renameGeography } from "@/lib/api/admin-client";
import type { GeographyCreateInput } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult } from "@/lib/admin/action-helpers";

export type { ActionResult };

export async function createGeographyAction(input: GeographyCreateInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => createGeography(token, input));
  if (!result.ok) return result;
  revalidatePath("/admin/geografia");
  redirect("/admin/geografia");
}

export async function renameGeographyAction(id: string, name: string): Promise<ActionResult> {
  const result = await runAdminMutation((token) => renameGeography(token, id, name));
  if (result.ok) {
    revalidatePath("/admin/geografia");
    revalidatePath(`/admin/geografia/${id}`);
  }
  return result;
}

/**
 * Botón de activar/desactivar en la lista: form simple sin JS (progressive
 * enhancement) — por eso no puede devolver un ActionResult (el tipo de
 * `action` en un <form> exige void|Promise<void>). Un error real igual se
 * ve: se relanza con el mensaje del backend en vez de tragárselo.
 */
export async function setGeographyActiveAction(id: string, active: boolean): Promise<void> {
  const result = await runAdminMutation((token) =>
    active ? activateGeography(token, id) : deactivateGeography(token, id),
  );
  if (!result.ok) {
    throw new Error(result.error);
  }
  revalidatePath("/admin/geografia");
}
