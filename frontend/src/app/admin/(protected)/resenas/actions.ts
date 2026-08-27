"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  approveReview,
  archiveReview,
  createReview,
  publishReview,
  rejectReview,
  scheduleReview,
  submitReview,
  updateReview,
} from "@/lib/api/admin-client";
import type { ReviewInput } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult } from "@/lib/admin/action-helpers";

export type { ActionResult };

export async function createReviewAction(input: ReviewInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => createReview(token, input));
  if (!result.ok) return result;
  revalidatePath("/admin/resenas");
  redirect(`/admin/resenas/${result.data.id}`);
}

export async function updateReviewAction(id: string, input: ReviewInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updateReview(token, id, input));
  if (result.ok) {
    revalidatePath("/admin/resenas");
    revalidatePath(`/admin/resenas/${id}`);
  }
  return result;
}

export async function submitReviewAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, submitReview);
}

export async function approveReviewAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, approveReview);
}

export async function rejectReviewAction(id: string, reason: string): Promise<ActionResult> {
  return runWorkflowAction(id, (token) => rejectReview(token, id, reason));
}

export async function publishReviewAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, publishReview);
}

export async function scheduleReviewAction(id: string, scheduledAtIso: string): Promise<ActionResult> {
  return runWorkflowAction(id, (token) => scheduleReview(token, id, scheduledAtIso));
}

export async function archiveReviewAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, archiveReview);
}

async function runWorkflowAction(
  id: string,
  call: (token: string, id: string) => Promise<unknown>,
): Promise<ActionResult> {
  const result = await runAdminMutation((token) => call(token, id));
  if (result.ok) {
    revalidatePath("/admin/resenas");
    revalidatePath(`/admin/resenas/${id}`);
  }
  return result;
}
