"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminApiError, login } from "@/lib/api/admin-client";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "@/lib/admin/session";

export type LoginResult = { ok: false; error: string };

export async function loginAction(email: string, password: string, redirectTo: string | null): Promise<LoginResult> {
  try {
    const tokens = await login(email, password);
    const store = await cookies();
    store.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, accessTokenCookieOptions());
    store.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, refreshTokenCookieOptions());
  } catch (error) {
    if (error instanceof AdminApiError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "No se pudo conectar con el servidor. Intenta nuevamente." };
  }

  // redirect() lanza una excepción de control de flujo: debe llamarse fuera
  // del try/catch de arriba para que no la intercepte el catch genérico.
  redirect(redirectTo && redirectTo.startsWith("/admin") ? redirectTo : "/admin");
}
