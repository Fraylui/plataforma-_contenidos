"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  approveGallery,
  archiveGallery,
  createGallery,
  publishGallery,
  rejectGallery,
  scheduleGallery,
  submitGallery,
  updateGallery,
} from "@/lib/api/admin-client";
import type { GalleryInput } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult } from "@/lib/admin/action-helpers";

export type { ActionResult };

export async function createGalleryAction(input: GalleryInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => createGallery(token, input));
  if (!result.ok) return result;
  revalidatePath("/admin/galerias");
  redirect(`/admin/galerias/${result.data.id}`);
}

export async function updateGalleryAction(id: string, input: GalleryInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updateGallery(token, id, input));
  if (result.ok) {
    revalidatePath("/admin/galerias");
    revalidatePath(`/admin/galerias/${id}`);
  }
  return result;
}

export async function submitGalleryAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, submitGallery);
}

export async function approveGalleryAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, approveGallery);
}

export async function rejectGalleryAction(id: string, reason: string): Promise<ActionResult> {
  return runWorkflowAction(id, (token) => rejectGallery(token, id, reason));
}

export async function publishGalleryAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, publishGallery);
}

export async function scheduleGalleryAction(id: string, scheduledAtIso: string): Promise<ActionResult> {
  return runWorkflowAction(id, (token) => scheduleGallery(token, id, scheduledAtIso));
}

export async function archiveGalleryAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, archiveGallery);
}

async function runWorkflowAction(
  id: string,
  call: (token: string, id: string) => Promise<unknown>,
): Promise<ActionResult> {
  const result = await runAdminMutation((token) => call(token, id));
  if (result.ok) {
    revalidatePath("/admin/galerias");
    revalidatePath(`/admin/galerias/${id}`);
  }
  return result;
}
