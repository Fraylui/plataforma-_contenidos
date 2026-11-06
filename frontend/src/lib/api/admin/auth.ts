// Sesión del panel: entrar, salir, quién soy y cambiar la contraseña propia (AuthController, UsersController).
import "server-only";
import { orDefault } from "@/lib/server-log";
import type { AdminUser, TokenResponse } from "../admin-types";
import { BACKEND_API_URL, authedJson, publicJson } from "./http";

export function login(email: string, password: string): Promise<TokenResponse> {
  return publicJson("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutSession(refreshToken: string): Promise<void> {
  // Best-effort: si el refresh token ya no es válido no hay nada que revocar.
  await fetch(`${BACKEND_API_URL}/api/v1/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  }).catch(orDefault("panel.cerrar-sesion", undefined));
}

export function getCurrentUser(accessToken: string): Promise<AdminUser> {
  return authedJson("/api/v1/users/me", accessToken);
}

/** Mi cuenta: cambio de la contraseña propia. Devuelve una sesión nueva (las anteriores quedan invalidadas). */
export function changeOwnPassword(accessToken: string, currentPassword: string, newPassword: string): Promise<TokenResponse> {
  return authedJson<TokenResponse>("/api/v1/users/me/password", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
