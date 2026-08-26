import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminApiError, AdminSessionExpiredError, getCurrentUser } from "@/lib/api/admin-client";
import type { AdminUser } from "@/lib/api/admin-types";
import { ACCESS_TOKEN_COOKIE } from "./session";

/**
 * El fetch real (GET /users/me), memoizado por request con React cache():
 * requireAdminUser() se llama una vez en admin/(protected)/layout.tsx y de
 * nuevo en cada page.tsx anidada (defense in depth — cada nivel valida por
 * su cuenta, no confía en que el padre ya lo hizo). Sin cache(), eso eran
 * dos round-trips reales al backend por cada carga de página. Encontrado
 * en la revisión de código de esta fase.
 */
const getSessionUser = cache(async (): Promise<{ user: AdminUser; accessToken: string } | null> => {
  const store = await cookies();
  const accessToken = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    return null;
  }

  try {
    const user = await getCurrentUser(accessToken);
    return { user, accessToken };
  } catch (error) {
    if (error instanceof AdminSessionExpiredError) {
      return null;
    }
    // GET /users/me solo exige .authenticated() en SecurityConfig (sin
    // restricción de rol), así que un 403 acá SOLO puede significar "el
    // token no es válido" — nunca "rol insuficiente" (eso no puede pasar en
    // este endpoint). Por eso es seguro tratarlo igual que sesión inválida.
    // El backend devuelve 403 en vez de 401 para cualquier token
    // ausente/expirado/inválido (Spring Security con el
    // AuthenticationEntryPoint por defecto, sin login form/httpBasic
    // configurado) — ver JwtAuthenticationFilter: un token que no parsea
    // deja el request como anónimo, no lanza un 401 explícito.
    if (error instanceof AdminApiError && error.status === 403) {
      return null;
    }
    throw error;
  }
});

/**
 * Sesión actual para usar dentro de Server Components/Actions del panel.
 * proxy.ts ya garantiza que si llegamos aquí hay (o hubo, y se renovó) un
 * access token válido; esto es una segunda verificación real contra el
 * backend (defense in depth — ver memoria "engineering-guardrails": nunca
 * confiar solo en el frontend/proxy para autorización).
 */
export async function requireAdminUser(): Promise<{ user: AdminUser; accessToken: string }> {
  const session = await getSessionUser();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
