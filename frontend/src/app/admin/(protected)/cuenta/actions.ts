"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { changeOwnPassword } from "@/lib/api/admin-client";
import { runAdminMutation, type MutationResult } from "@/lib/admin/action-helpers";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "@/lib/admin/session";

/**
 * Cambio de la contraseña propia. El backend invalida todas las sesiones
 * anteriores y devuelve una nueva: se guarda en las cookies para que quien
 * la cambió siga dentro (si no, al vencer el token lo sacaba al login).
 */
export async function changePasswordAction(currentPassword: string, newPassword: string): Promise<MutationResult<null>> {
  const result = await runAdminMutation((token) => changeOwnPassword(token, currentPassword, newPassword));
  if (!result.ok) return result;
  const store = await cookies();
  store.set(ACCESS_TOKEN_COOKIE, result.data.accessToken, accessTokenCookieOptions());
  store.set(REFRESH_TOKEN_COOKIE, result.data.refreshToken, refreshTokenCookieOptions());
  revalidatePath("/admin", "layout");
  return { ok: true, data: null };
}
