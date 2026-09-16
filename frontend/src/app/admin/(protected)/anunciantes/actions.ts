"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  activateCampaign,
  createAdvertiser,
  createCampaign,
  deactivateCampaign,
  deleteAdvertiser,
  deleteCampaign,
  updateAdvertiser,
  updateCampaign,
} from "@/lib/api/admin-client";
import type { AdvertiserInput, CampaignInput } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult } from "@/lib/admin/action-helpers";

export type { ActionResult };

export async function createAdvertiserAction(input: AdvertiserInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => createAdvertiser(token, input));
  if (!result.ok) return result;
  revalidatePath("/admin/anunciantes");
  redirect(`/admin/anunciantes/${result.data.id}`);
}

export async function updateAdvertiserAction(id: string, input: AdvertiserInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updateAdvertiser(token, id, input));
  if (result.ok) {
    revalidatePath("/admin/anunciantes");
    revalidatePath(`/admin/anunciantes/${id}`);
  }
  return result;
}

/** Bloqueado por el backend si tiene campañas (409) — ver AdvertiserHasCampaignsException. */
export async function deleteAdvertiserAction(id: string): Promise<void> {
  const result = await runAdminMutation((token) => deleteAdvertiser(token, id));
  if (!result.ok) {
    throw new Error(result.error);
  }
  revalidatePath("/admin/anunciantes");
  redirect("/admin/anunciantes");
}

export async function createCampaignAction(advertiserId: string, input: CampaignInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => createCampaign(token, input));
  if (!result.ok) return result;
  revalidatePath(`/admin/anunciantes/${advertiserId}`);
  redirect(`/admin/anunciantes/${advertiserId}`);
}

export async function updateCampaignAction(
  advertiserId: string,
  campaignId: string,
  input: CampaignInput,
): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updateCampaign(token, campaignId, input));
  if (result.ok) {
    revalidatePath(`/admin/anunciantes/${advertiserId}`);
    revalidatePath(`/admin/anunciantes/${advertiserId}/campanas/${campaignId}`);
  }
  return result;
}

export async function setCampaignActiveAction(
  advertiserId: string,
  campaignId: string,
  active: boolean,
): Promise<void> {
  const result = await runAdminMutation((token) =>
    active ? activateCampaign(token, campaignId) : deactivateCampaign(token, campaignId),
  );
  if (!result.ok) {
    throw new Error(result.error);
  }
  revalidatePath(`/admin/anunciantes/${advertiserId}`);
}

export async function deleteCampaignAction(advertiserId: string, campaignId: string): Promise<void> {
  const result = await runAdminMutation((token) => deleteCampaign(token, campaignId));
  if (!result.ok) {
    throw new Error(result.error);
  }
  revalidatePath(`/admin/anunciantes/${advertiserId}`);
}
