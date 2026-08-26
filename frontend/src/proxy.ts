import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "@/lib/admin/session";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8080";

/**
 * Guarda de acceso a /admin/**. No es la única línea de defensa (el backend
 * valida el JWT en cada request igualmente — sección 39.3 de CONTEXTO.md),
 * pero evita que Server Components sin sesión intenten renderizar y fallen
 * con un 401 a mitad de página, y renueva el access token de forma
 * transparente cuando expiró pero el refresh token todavía es válido.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (accessToken) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return redirectToLogin(request);
  }

  const renewed = await tryRefresh(refreshToken);
  if (!renewed) {
    const response = redirectToLogin(request);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  // Reenvía las cookies nuevas tanto al render actual (request) como al
  // navegador (response), para no forzar una segunda ida y vuelta.
  request.cookies.set(ACCESS_TOKEN_COOKIE, renewed.accessToken);
  request.cookies.set(REFRESH_TOKEN_COOKIE, renewed.refreshToken);
  const response = NextResponse.next({ request });
  response.cookies.set(ACCESS_TOKEN_COOKIE, renewed.accessToken, accessTokenCookieOptions());
  response.cookies.set(REFRESH_TOKEN_COOKIE, renewed.refreshToken, refreshTokenCookieOptions());
  return response;
}

async function tryRefresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
