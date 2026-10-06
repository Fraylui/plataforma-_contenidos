"use server";

import { revalidatePath } from "next/cache";
import { createWorker, resetWorkerPassword, setWorkerActive, updateWorkerPermissions } from "@/lib/api/admin-client";
import type { CreateWorkerInput, ModulePermissions } from "@/lib/api/admin-types";
import { runAdminMutation, type MutationResult } from "@/lib/admin/action-helpers";

/** Alta: devuelve la contraseña temporal para mostrarla una sola vez (no se redirige hasta cerrar el diálogo). */
export async function createWorkerAction(input: CreateWorkerInput): Promise<MutationResult<{ id: string; temporaryPassword: string }>> {
  const result = await runAdminMutation((token) => createWorker(token, input));
  if (!result.ok) return result;
  revalidatePath("/admin/trabajadores");
  return { ok: true, data: { id: result.data.worker.id, temporaryPassword: result.data.temporaryPassword } };
}

export async function updateWorkerPermissionsAction(id: string, permissions: ModulePermissions): Promise<MutationResult<null>> {
  const result = await runAdminMutation((token) => updateWorkerPermissions(token, id, permissions));
  if (!result.ok) return result;
  revalidatePath("/admin/trabajadores");
  revalidatePath(`/admin/trabajadores/${id}`);
  return { ok: true, data: null };
}

export async function resetWorkerPasswordAction(id: string): Promise<MutationResult<{ temporaryPassword: string }>> {
  const result = await runAdminMutation((token) => resetWorkerPassword(token, id));
  if (!result.ok) return result;
  revalidatePath(`/admin/trabajadores/${id}`);
  return { ok: true, data: result.data };
}

export async function setWorkerActiveAction(id: string, active: boolean): Promise<MutationResult<null>> {
  const result = await runAdminMutation((token) => setWorkerActive(token, id, active));
  if (!result.ok) return result;
  revalidatePath("/admin/trabajadores");
  revalidatePath(`/admin/trabajadores/${id}`);
  return { ok: true, data: null };
}
