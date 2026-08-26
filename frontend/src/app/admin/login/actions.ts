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

export type LoginResult = { ok: false; error: string } | { ok: false; needsMfa: true };

// El backend responde 401 tanto para credenciales inválidas como para MFA
// faltante/incorrecto, distinguibles solo por este mensaje exacto (ver
// InvalidCredentialsException / MfaRequiredException en el backend). Es
// frágil ante un cambio de texto; lo ideal a futuro es que el backend
// exponga un código de error máquina-legible en vez de solo el mensaje.
const MFA_REQUIRED_MESSAGE = "Se requiere un código MFA válido";

export async function loginAction(
  email: string,
  password: string,
  mfaCode: string,
  redirectTo: string | null,
): Promise<LoginResult> {
  let mfaSetupRequired = false;

  try {
    const tokens = await login(email, password, mfaCode || undefined);
    const store = await cookies();
    store.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, accessTokenCookieOptions());
    store.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, refreshTokenCookieOptions());
    mfaSetupRequired = tokens.mfaSetupRequired;
  } catch (error) {
    if (error instanceof AdminApiError) {
      if (error.status === 401 && error.message === MFA_REQUIRED_MESSAGE) {
        return { ok: false, needsMfa: true };
      }
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "No se pudo conectar con el servidor. Intenta nuevamente." };
  }

  // redirect() lanza una excepción de control de flujo: debe llamarse fuera
  // del try/catch de arriba para que no la intercepte el catch genérico.
  if (mfaSetupRequired) {
    redirect("/admin/mfa-setup");
  }
  redirect(redirectTo && redirectTo.startsWith("/admin") ? redirectTo : "/admin");
}
