"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createBusiness,
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

