import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminApiError, AdminSessionExpiredError } from "@/lib/api/admin-client";
import { ACCESS_TOKEN_COOKIE } from "./session";

/**
 * Compartido por todos los admin/*\/actions.ts: leer el access token (o
 * mandar a login si no hay sesión) y traducir un AdminApiError en un
 * ActionResult mostrable, en vez de dejarlo reventar sin capturar. Antes
 * esto estaba duplicado casi literal en cada actions.ts — divergió al
 * menos una vez (etiquetas/actions.ts no traducía errores de la
 * eliminación, ej. un 409 por etiqueta en uso, y crasheaba a la pantalla
 * de error genérica en vez de mostrar el mensaje).
 */
async function requireAccessToken(): Promise<string> {
  const store = await cookies();
  const token = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    redirect("/admin/login");
  }
  return token;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

function describeError(error: unknown): { ok: false; error: string } {
  if (error instanceof AdminApiError) {
    return { ok: false, error: error.message };
  }
  return { ok: false, error: "No se pudo completar la operación. Intenta nuevamente." };
}

export type MutationResult<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Envuelve una mutación admin: obtiene el token, la ejecuta, y traduce
 * cualquier error en un resultado tipado — sesión vencida redirige a
 * login, cualquier otro error del backend se devuelve como mensaje
 * mostrable en vez de crashear la página a la boundary de error genérica.
 */
export async function runAdminMutation<T>(call: (accessToken: string) => Promise<T>): Promise<MutationResult<T>> {
  const token = await requireAccessToken();
  try {
    const data = await call(token);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof AdminSessionExpiredError) {
      redirect("/admin/login");
    }
    return describeError(error);
  }
}
