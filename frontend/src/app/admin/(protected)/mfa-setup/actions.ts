"use server";

import { confirmMfa, enrollMfa } from "@/lib/api/admin-client";
import { runAdminMutation } from "@/lib/admin/action-helpers";

export type EnrollResult =
  | { ok: true; provisioningUri: string; secretBase32: string }
  | { ok: false; error: string };

export async function startMfaEnrollmentAction(): Promise<EnrollResult> {
  const result = await runAdminMutation((token) => enrollMfa(token));
  if (!result.ok) return result;
  return { ok: true, ...result.data };
}

export type ConfirmResult = { ok: true; backupCodes: string[] } | { ok: false; error: string };

export async function confirmMfaEnrollmentAction(code: string): Promise<ConfirmResult> {
  const result = await runAdminMutation((token) => confirmMfa(token, code));
  if (!result.ok) return result;
  return { ok: true, backupCodes: result.data.backupCodes };
}
