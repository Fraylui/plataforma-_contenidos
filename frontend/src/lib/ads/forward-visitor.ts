import "server-only";
import type { NextRequest } from "next/server";

/**
 * Cabeceras para que el backend vea al visitante real y no al contenedor de
 * Next: la IP (tope de frecuencia y antiduplicado, ver AdDeliveryGuard) y
 * el user agent (filtro de robots, ver InvalidTraffic). nginx ya pone
 * X-Forwarded-For; el backend confía en él porque viene de la red interna
 * (server.forward-headers-strategy).
 */
export function visitorHeaders(request: NextRequest): HeadersInit {
  const headers: Record<string, string> = {};
  const forwardedFor = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
  if (forwardedFor) headers["X-Forwarded-For"] = forwardedFor;
  const userAgent = request.headers.get("user-agent");
  if (userAgent) headers["User-Agent"] = userAgent;
  return headers;
}
