// Núcleo de las llamadas del panel al backend. A diferencia de
// src/lib/api/client.ts (público, cacheado), nunca se cachean (datos privados,
// mutables) y casi todas requieren Authorization: Bearer. Solo se invoca desde
// el servidor de Next.js (Server Actions, Server Components, proxy.ts) — ver
// src/lib/admin/session.ts para el porqué. Cada módulo del backend tiene su
// archivo en esta carpeta.
import "server-only";
import { headers } from "next/headers";
import { problemMessage } from "../problem";

export const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";

/** Error del backend con status HTTP y mensaje ya extraídos, para que la UI decida qué mostrar. */
export class AdminApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** El access token dejó de ser válido (expiró o fue revocado): quien llama debe redirigir a login. */
export class AdminSessionExpiredError extends Error {}

/** Mensaje de un error de la API (RFC 9457, ver lib/api/problem.ts). */
export async function parseErrorMessage(res: Response): Promise<string> {
  try {
    return problemMessage(await res.json(), res.status);
  } catch {
    return problemMessage(null, res.status);
  }
}

const IP_PATTERN = /^[0-9a-fA-F:.]{3,45}$/;

/**
 * IP real del visitante para el backend. Las llamadas admin salen del
 * servidor de Next, así que sin esto Spring solo veía la IP del contenedor
 * del frontend: el límite de intentos de login (LoginRateLimiter, por IP)
 * era UN contador compartido por todo el mundo — 5 contraseñas falladas de
 * cualquiera bloqueaban el panel a todos 15 minutos — y la auditoría
 * registraba siempre la misma IP. nginx pone X-Real-IP (ya resuelta detrás
 * de Cloudflare, ver infra/nginx); Spring la toma de X-Forwarded-For porque
 * confía en proxies de la red interna (server.forward-headers-strategy).
 * Sin nginx delante (desarrollo local) no hay header y todo sigue como antes.
 */
async function clientIpHeaders(): Promise<Record<string, string>> {
  try {
    const ip = (await headers()).get("x-real-ip");
    return ip && IP_PATTERN.test(ip) ? { "X-Forwarded-For": ip } : {};
  } catch {
    // Fuera de un pedido (build, tareas de fondo): no hay visitante que identificar.
    return {};
  }
}

export async function publicJson<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_API_URL}${path}`, {
    ...init,
    headers: { ...(await clientIpHeaders()), ...init.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new AdminApiError(res.status, await parseErrorMessage(res));
  }
  return res.json() as Promise<T>;
}

/** Llamada autenticada genérica. Traduce un 401 del backend en AdminSessionExpiredError. */
export async function authedJson<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_API_URL}${path}`, {
    ...init,
    headers: { ...(await clientIpHeaders()), ...init?.headers, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (res.status === 401) {
    throw new AdminSessionExpiredError();
  }
  if (!res.ok) {
    throw new AdminApiError(res.status, await parseErrorMessage(res));
  }
  // Varios endpoints admin devuelven `void` sin @ResponseStatus explícito
  // (ej. activate/deactivate/delete de categorías): Spring los sirve como
  // 200 con cuerpo vacío, no 204 — probar 204 solo no alcanza.
  const text = await res.text();
  if (text.length === 0) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}
