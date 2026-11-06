import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "@/lib/admin/session";
import { adminCsp } from "@/lib/security/csp";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";

/**
 * Guarda de acceso a /admin/**. No es la única línea de defensa (el backend
 * valida el JWT en cada request igualmente — sección 39.3 de CONTEXTO.md),
 * pero evita que Server Components sin sesión intenten renderizar y fallen
 * con un 401 a mitad de página, y renueva el access token de forma
 * transparente cuando expiró pero el refresh token todavía es válido.
 *
 * También pone la CSP estricta del panel: un nonce nuevo por visita, que Next
 * lee de la cabecera de la petición y aplica a sus propios <script>
 * (lib/security/csp.ts explica por qué el sitio público no puede usarlo).
 */
export async function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = adminCsp(nonce, { dev: process.env.NODE_ENV !== "production" });
  const response = await guard(request, () => forward(request, nonce, csp));
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

/** Sigue al render con el nonce en la petición (Next lo extrae de content-security-policy). */
function forward(request: NextRequest, nonce: string, csp: string) {
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", csp);
  return NextResponse.next({ request: { headers } });
}

async function guard(request: NextRequest, next: () => NextResponse): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // /admin/muestra/** (sistema de diseño y compositor con datos de ejemplo) en producción no existe.
  if (pathname === "/admin/login" || (process.env.NODE_ENV !== "production" && (pathname === "/admin/muestra" || pathname.startsWith("/admin/muestra/")))) {
    return next();
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (accessToken) {
    return next();
  }

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return redirectToLogin(request);
  }

  const realIp = request.headers.get("x-real-ip");
  const renewed = await tryRefresh(refreshToken, realIp && /^[0-9a-fA-F:.]{3,45}$/.test(realIp) ? realIp : null);
  if (!renewed) {
    const response = redirectToLogin(request);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  // Reenvía las cookies nuevas tanto al render actual (request) como al
  // navegador (response), para no forzar una segunda ida y vuelta.
  request.cookies.set(ACCESS_TOKEN_COOKIE, renewed.accessToken);
  request.cookies.set(REFRESH_TOKEN_COOKIE, renewed.refreshToken);
  const response = next();
  response.cookies.set(ACCESS_TOKEN_COOKIE, renewed.accessToken, accessTokenCookieOptions());
  response.cookies.set(REFRESH_TOKEN_COOKIE, renewed.refreshToken, refreshTokenCookieOptions());
  return response;
}

async function tryRefresh(
  refreshToken: string,
  clientIp: string | null,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      // IP real del visitante (ver clientIpHeaders en lib/api/admin/http.ts).
      headers: { "Content-Type": "application/json", ...(clientIp ? { "X-Forwarded-For": clientIp } : {}) },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) {
      return null;
    }
    const body = (await res.json()) as { accessToken: string; refreshToken: string };
    return body;
  } catch {
    // Backend inalcanzable: no se puede confirmar la sesión, se trata como no autenticado.
    return null;
  }
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: "/admin/:path*",
};
