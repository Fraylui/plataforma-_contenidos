"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createPlace,
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

