"use server";

import { revalidatePath } from "next/cache";
import { runPublicationStep } from "@/lib/api/admin-client";
import { runAdminMutation, type ActionResult } from "@/lib/admin/action-helpers";
import {
  isPublicationKind,
  PUBLICATION_KINDS,
  PUBLICATION_STEPS,
  type PublicationKind,
  type PublicationStep,
} from "@/lib/admin/publication";

/**
 * Un paso del flujo de publicación para cualquiera de los 5 tipos (antes,
 * 6 acciones copiadas en 5 archivos). Llega desde el navegador: tipo y paso
 * se validan contra la lista cerrada; los permisos los decide el backend.
 */
export async function publicationStepAction(
  kind: PublicationKind,
  id: string,
  step: PublicationStep,
  body?: { scheduledAt?: string; note?: string },
): Promise<ActionResult> {
  if (!isPublicationKind(kind) || !PUBLICATION_STEPS.includes(step)) {
    return { ok: false, error: "Acción no válida." };
  }
  const result = await runAdminMutation((token) => runPublicationStep(token, kind, id, step, body));
  if (!result.ok) return result;
  const { adminPath } = PUBLICATION_KINDS[kind];
  revalidatePath(adminPath);
  revalidatePath(`${adminPath}/${id}`);
  revalidatePath("/admin");
  return { ok: true };
}
