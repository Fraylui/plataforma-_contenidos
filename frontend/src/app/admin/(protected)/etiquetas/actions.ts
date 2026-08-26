"use server";

import { revalidatePath } from "next/cache";
import { deleteTag } from "@/lib/api/admin-client";
import { runAdminMutation } from "@/lib/admin/action-helpers";

/**
 * Antes esta acción no traducía errores del backend (ej. 409 si la
 * etiqueta sigue en uso) — el mensaje real se perdía. Sigue siendo un form
 * simple sin JS (progressive enhancement, action debe ser void), así que
 * un error real se relanza CON el mensaje del backend en vez de un 500
 * genérico. Encontrado en la revisión de código de esta fase.
 */
export async function deleteTagAction(id: string): Promise<void> {
  const result = await runAdminMutation((token) => deleteTag(token, id));
  if (!result.ok) {
    throw new Error(result.error);
  }
  revalidatePath("/admin/etiquetas");
}
