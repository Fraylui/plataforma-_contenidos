"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  approvePlace,
  archivePlace,
  createPlace,
  publishPlace,
  rejectPlace,
  schedulePlace,
  submitPlace,
  updatePlace,
} from "@/lib/api/admin-client";
import type { PlaceInput } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult } from "@/lib/admin/action-helpers";

export type { ActionResult };

export async function createPlaceAction(input: PlaceInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => createPlace(token, input));
  if (!result.ok) return result;
  revalidatePath("/admin/lugares");
  redirect(`/admin/lugares/${result.data.id}`);
}

export async function updatePlaceAction(id: string, input: PlaceInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updatePlace(token, id, input));
  if (result.ok) {
    revalidatePath("/admin/lugares");
    revalidatePath(`/admin/lugares/${id}`);
  }
  return result;
}

export async function submitPlaceAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, submitPlace);
}

export async function approvePlaceAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, approvePlace);
}

export async function rejectPlaceAction(id: string, reason: string): Promise<ActionResult> {
  return runWorkflowAction(id, (token) => rejectPlace(token, id, reason));
}

export async function publishPlaceAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, publishPlace);
}

export async function schedulePlaceAction(id: string, scheduledAtIso: string): Promise<ActionResult> {
  return runWorkflowAction(id, (token) => schedulePlace(token, id, scheduledAtIso));
}

export async function archivePlaceAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, archivePlace);
}

async function runWorkflowAction(
  id: string,
  call: (token: string, id: string) => Promise<unknown>,
): Promise<ActionResult> {
  const result = await runAdminMutation((token) => call(token, id));
  if (result.ok) {
    revalidatePath("/admin/lugares");
    revalidatePath(`/admin/lugares/${id}`);
  }
  return result;
}
