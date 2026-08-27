"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  approveEvent,
  archiveEvent,
  createEvent,
  publishEvent,
  rejectEvent,
  scheduleEvent,
  submitEvent,
  updateEvent,
} from "@/lib/api/admin-client";
import type { EventInput } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult } from "@/lib/admin/action-helpers";

export type { ActionResult };

export async function createEventAction(input: EventInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => createEvent(token, input));
  if (!result.ok) return result;
  revalidatePath("/admin/eventos");
  redirect(`/admin/eventos/${result.data.id}`);
}

export async function updateEventAction(id: string, input: EventInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updateEvent(token, id, input));
  if (result.ok) {
    revalidatePath("/admin/eventos");
    revalidatePath(`/admin/eventos/${id}`);
  }
  return result;
}

export async function submitEventAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, submitEvent);
}

export async function approveEventAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, approveEvent);
}

export async function rejectEventAction(id: string, reason: string): Promise<ActionResult> {
  return runWorkflowAction(id, (token) => rejectEvent(token, id, reason));
}

export async function publishEventAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, publishEvent);
}

export async function scheduleEventAction(id: string, scheduledAtIso: string): Promise<ActionResult> {
  return runWorkflowAction(id, (token) => scheduleEvent(token, id, scheduledAtIso));
}

export async function archiveEventAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, archiveEvent);
}

async function runWorkflowAction(
  id: string,
  call: (token: string, id: string) => Promise<unknown>,
): Promise<ActionResult> {
  const result = await runAdminMutation((token) => call(token, id));
  if (result.ok) {
    revalidatePath("/admin/eventos");
    revalidatePath(`/admin/eventos/${id}`);
  }
  return result;
}
