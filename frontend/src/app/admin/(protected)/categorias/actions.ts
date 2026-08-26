"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { activateCategory, createCategory, deactivateCategory, updateCategory } from "@/lib/api/admin-client";
import type { CategoryCreateInput, CategoryUpdateInput } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult } from "@/lib/admin/action-helpers";

export type { ActionResult };

export async function createCategoryAction(input: CategoryCreateInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => createCategory(token, input));
  if (!result.ok) return result;
  revalidatePath("/admin/categorias");
  redirect("/admin/categorias");
}

export async function updateCategoryAction(id: string, input: CategoryUpdateInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updateCategory(token, id, input));
  if (result.ok) {
    revalidatePath("/admin/categorias");
    revalidatePath(`/admin/categorias/${id}`);
  }
  return result;
}

/**
 * Botón de activar/desactivar en la lista: form simple sin JS (progressive
 * enhancement) — por eso no puede devolver un ActionResult (el tipo de
 * `action` en un <form> exige void|Promise<void>). Un error real igual se
 * ve: se relanza con el mensaje del backend en vez de tragárselo.
 */
export async function setCategoryActiveAction(id: string, active: boolean): Promise<void> {
  const result = await runAdminMutation((token) =>
    active ? activateCategory(token, id) : deactivateCategory(token, id),
  );
  if (!result.ok) {
    throw new Error(result.error);
  }
  revalidatePath("/admin/categorias");
}
