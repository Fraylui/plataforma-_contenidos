"use server";

import { revalidatePath } from "next/cache";
import {
  addEpisode,
  createSeries,
  setEpisodeArchived,
  syncSeries,
  updateEpisode,
  updateSeries,
} from "@/lib/api/admin/series";
import type { CreateSeriesInput, SeriesSyncResult, UpdateSeriesInput } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult, type MutationResult } from "@/lib/admin/action-helpers";

function refresh(id?: string) {
  revalidatePath("/admin/series");
  if (id) revalidatePath(`/admin/series/${id}`);
}

/** Conecta la lista de YouTube y trae sus episodios; devuelve el id para ir a la serie. */
export async function createSeriesAction(input: CreateSeriesInput): Promise<MutationResult<{ id: string }>> {
  const result = await runAdminMutation((token) => createSeries(token, input));
  if (!result.ok) return result;
  refresh();
  return { ok: true, data: { id: result.data.id } };
}

export async function updateSeriesAction(id: string, input: UpdateSeriesInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updateSeries(token, id, input));
  if (result.ok) refresh(id);
  return result;
}

export async function syncSeriesAction(id: string): Promise<MutationResult<SeriesSyncResult>> {
  const result = await runAdminMutation((token) => syncSeries(token, id));
  if (result.ok) refresh(id);
  return result;
}

export async function addEpisodeAction(id: string, videoUrl: string): Promise<ActionResult> {
  const result = await runAdminMutation((token) => addEpisode(token, id, { videoUrl }));
  if (result.ok) refresh(id);
  return result;
}

export async function updateEpisodeAction(id: string, episodeId: string, input: { title: string; notes: string }): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updateEpisode(token, id, episodeId, input));
  if (result.ok) refresh(id);
  return result;
}

export async function setEpisodeArchivedAction(id: string, episodeId: string, archived: boolean): Promise<ActionResult> {
  const result = await runAdminMutation((token) => setEpisodeArchived(token, id, episodeId, archived));
  if (result.ok) refresh(id);
  return result;
}
