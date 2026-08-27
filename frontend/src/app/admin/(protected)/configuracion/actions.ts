"use server";

import { revalidatePath } from "next/cache";
import { updatePlatformSettings } from "@/lib/api/admin-client";
import type { PlatformSettingsInput } from "@/lib/api/admin-types";
import { runAdminMutation, type ActionResult } from "@/lib/admin/action-helpers";

export type { ActionResult };

export async function updatePlatformSettingsAction(input: PlatformSettingsInput): Promise<ActionResult> {
  const result = await runAdminMutation((token) => updatePlatformSettings(token, input));
  if (!result.ok) return result;
  // Todo el sitio público y el layout admin leen esta config: revalidar ambos árboles.
  revalidatePath("/", "layout");
  revalidatePath("/admin/configuracion");
  return { ok: true };
}
