"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  approveArticle,
  archiveArticle,
  createArticle,
  publishArticle,
  rejectArticle,
  scheduleArticle,
  submitArticle,
  updateArticle,
} from "@/lib/api/admin-client";
import type { ArticleInput } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult } from "@/lib/admin/action-helpers";

export type { ActionResult };

export async function createArticleAction(input: ArticleInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => createArticle(token, input));
  if (!result.ok) return result;
  revalidatePath("/admin/articulos");
  redirect(`/admin/articulos/${result.data.id}`);
}

export async function updateArticleAction(id: string, input: ArticleInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updateArticle(token, id, input));
  if (result.ok) {
    revalidatePath("/admin/articulos");
    revalidatePath(`/admin/articulos/${id}`);
  }
  return result;
}

export async function submitArticleAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, submitArticle);
}

export async function approveArticleAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, approveArticle);
}

export async function rejectArticleAction(id: string, reason: string): Promise<ActionResult> {
  return runWorkflowAction(id, (token) => rejectArticle(token, id, reason));
}

export async function publishArticleAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, publishArticle);
}

export async function scheduleArticleAction(id: string, scheduledAtIso: string): Promise<ActionResult> {
  return runWorkflowAction(id, (token) => scheduleArticle(token, id, scheduledAtIso));
}

export async function archiveArticleAction(id: string): Promise<ActionResult> {
  return runWorkflowAction(id, archiveArticle);
}

async function runWorkflowAction(
  id: string,
  call: (token: string, id: string) => Promise<unknown>,
): Promise<ActionResult> {
  const result = await runAdminMutation((token) => call(token, id));
  if (result.ok) {
    revalidatePath("/admin/articulos");
    revalidatePath(`/admin/articulos/${id}`);
  }
  return result;
}
