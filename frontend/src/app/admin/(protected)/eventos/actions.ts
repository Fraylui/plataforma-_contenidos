"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createEvent,
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

