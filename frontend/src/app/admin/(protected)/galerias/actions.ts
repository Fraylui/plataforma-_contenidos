"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createGallery,
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

