"use server";

import { revalidatePath } from "next/cache";
import {
  createArticle,
  updateArticle,
} from "@/lib/api/admin-client";
import type { ArticleInput } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult, type MutationResult } from "@/lib/admin/action-helpers";

export type { ActionResult };

/**
 * Crea el borrador y devuelve su id, sin redirigir: el compositor lo crea
 * con el guardado automático mientras se escribe y solo cambia la URL.
 */
export async function createArticleAction(input: ArticleInput): Promise<MutationResult<{ id: string }>> {
  const result = await runAdminMutation((token) => createArticle(token, input));
  if (!result.ok) return result;
  revalidatePath("/admin/publicaciones");
  return { ok: true, data: { id: result.data.id } };
}

export async function updateArticleAction(id: string, input: ArticleInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updateArticle(token, id, input));
  if (result.ok) {
    revalidatePath("/admin/publicaciones");
    revalidatePath(`/admin/publicaciones/${id}`);
  }
  return result;
}

