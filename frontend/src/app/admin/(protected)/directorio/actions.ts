"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  approveBusiness,
  archiveBusiness,
  createBusiness,
  publishBusiness,
  rejectBusiness,
  scheduleBusiness,
  submitBusiness,
  updateBusiness,
} from "@/lib/api/admin-client";
import type { BusinessInput } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult } from "@/lib/admin/action-helpers";

export type { ActionResult };

export async function createBusinessAction(input: BusinessInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => createBusiness(token, input));
  if (!result.ok) return result;
  revalidatePath("/admin/directorio");
  redirect(`/admin/directorio/${result.data.id}`);
}

export async function updateBusinessAction(id: string, input: BusinessInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updateBusiness(token, id, input));
  if (result.ok) {
    revalidatePath("/admin/directorio");
    revalidatePath(`/admin/directorio/${id}`);
  }
  return result;
}

export async function submitBusinessAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, submitBusiness);
}

export async function approveBusinessAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, approveBusiness);
}

export async function rejectBusinessAction(id: string, reason: string): Promise<ActionResult> {
  return runWorkflowAction(id, (token) => rejectBusiness(token, id, reason));
}

export async function publishBusinessAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, publishBusiness);
}

export async function scheduleBusinessAction(id: string, scheduledAtIso: string): Promise<ActionResult> {
  return runWorkflowAction(id, (token) => scheduleBusiness(token, id, scheduledAtIso));
}

export async function archiveBusinessAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, archiveBusiness);
}

async function runWorkflowAction(
  id: string,
  call: (token: string, id: string) => Promise<unknown>,
): Promise<ActionResult> {
  const result = await runAdminMutation((token) => call(token, id));
  if (result.ok) {
    revalidatePath("/admin/directorio");
    revalidatePath(`/admin/directorio/${id}`);
  }
  return result;
}
