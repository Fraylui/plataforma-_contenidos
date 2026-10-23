"use server";

import { revalidatePath } from "next/cache";
import { createStories, deleteStory, setStoryHighlighted, updateStory } from "@/lib/api/admin/stories";
import type { StoryItemInput } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult } from "@/lib/admin/action-helpers";

/** El panel se refresca; lo público (fila del Inicio, Destacadas) ya lo invalida runAdminMutation. */
function refresh(id?: string) {
  revalidatePath("/admin/historias");
  if (id) revalidatePath(`/admin/historias/${id}`);
}

/** Un lote (hasta 10, un tema): todas o ninguna. */
export async function createStoriesAction(categoryId: string, items: StoryItemInput[]): Promise<ActionResult> {
  const result = await runAdminMutation((token) => createStories(token, categoryId, items));
  if (result.ok) refresh();
  return result.ok ? { ok: true } : result;
}

export async function updateStoryAction(id: string, item: StoryItemInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updateStory(token, id, item));
  if (result.ok) refresh(id);
  return result.ok ? { ok: true } : result;
}

export async function setStoryHighlightedAction(id: string, highlighted: boolean): Promise<void> {
  const result = await runAdminMutation((token) => setStoryHighlighted(token, id, highlighted));
  if (result.ok) refresh(id);
}

export async function deleteStoryAction(id: string): Promise<void> {
  const result = await runAdminMutation((token) => deleteStory(token, id));
  if (result.ok) refresh();
}
