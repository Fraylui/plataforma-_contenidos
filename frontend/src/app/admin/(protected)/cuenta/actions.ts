"use server";

import { revalidatePath } from "next/cache";
import { changeOwnPassword } from "@/lib/api/admin-client";
import { runAdminMutation, type MutationResult } from "@/lib/admin/action-helpers";

export async function changePasswordAction(currentPassword: string, newPassword: string): Promise<MutationResult<null>> {
  const result = await runAdminMutation((token) => changeOwnPassword(token, currentPassword, newPassword));
  if (!result.ok) return result;
  revalidatePath("/admin", "layout");
  return { ok: true, data: null };
}
