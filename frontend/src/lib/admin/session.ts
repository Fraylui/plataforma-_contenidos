/**
 * Nombres y opciones de las cookies de sesión del panel administrativo.
 * Los tokens (JWT de acceso + refresh token opaco) viven SOLO en cookies
 * httpOnly puestas por el servidor de Next.js — el navegador nunca los ve
 * por JS (evita robo por XSS, ver memoria "engineering-guardrails"). El
 * navegador solo habla con Next.js; Next.js habla con el backend
 * server-to-server, igual que el sitio público (src/lib/api/client.ts).
 *
 * Sin "server-only": lo importan tanto Server Actions/Components como
 * proxy.ts, que corre en un bundle de servidor separado del árbol de la
 * app. Este archivo no contiene secretos, solo nombres/config de cookies.
 */

export const ACCESS_TOKEN_COOKIE = "admin_access_token";
export const REFRESH_TOKEN_COOKIE = "admin_refresh_token";

// Deben mantenerse en sincronía con app.security.jwt.* en
// backend/src/main/resources/application.yml (ACCESS_TOKEN_TTL_MINUTES /
// REFRESH_TOKEN_TTL_DAYS, default 15 min / 30 días). Un poco menores que el
// TTL real del backend para que la cookie expire en el navegador antes que
// el JWT deje de ser válido en el servidor, no después.
const ACCESS_TOKEN_TTL_SECONDS = 14 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 29 * 24 * 60 * 60;

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/admin",
  };
}

export function accessTokenCookieOptions() {
  return { ...baseCookieOptions(), maxAge: ACCESS_TOKEN_TTL_SECONDS };
}

export function refreshTokenCookieOptions() {
  return { ...baseCookieOptions(), maxAge: REFRESH_TOKEN_TTL_SECONDS };
}
