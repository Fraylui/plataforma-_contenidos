"use server";

import { revalidatePath } from "next/cache";
import { saveAffiliateLinks } from "@/lib/api/admin/affiliates";
import type { AffiliateContentType, AffiliateLink, AffiliateLinkInput } from "@/lib/api/admin-types";
import { runAdminMutation, type MutationResult } from "@/lib/admin/action-helpers";

const ADMIN_PATHS: Record<AffiliateContentType, string> = {
  PUBLICATION: "/admin/publicaciones",
  PLACE: "/admin/lugares",
};

/** Guarda la lista completa de enlaces de afiliado de un contenido (el orden es el de la lista). */
export async function saveAffiliateLinksAction(
  type: AffiliateContentType,
  contentId: string,
  links: AffiliateLinkInput[],
): Promise<MutationResult<AffiliateLink[]>> {
  if (type !== "PUBLICATION" && type !== "PLACE") return { ok: false, error: "Tipo de contenido inválido." };
  const result = await runAdminMutation((token) => saveAffiliateLinks(token, type, contentId, links));
  if (result.ok) {
    // runAdminMutation ya invalida la caché pública (PUBLIC_CONTENT_TAG).
    revalidatePath(`${ADMIN_PATHS[type]}/${contentId}`);
  }
  return result;
}
