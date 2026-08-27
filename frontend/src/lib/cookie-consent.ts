/**
 * Consentimiento de cookies (CONTEXTO.md sección 35.2: "banner de cookies
 * con opción real de rechazo, no solo 'aceptar'"). Solo cliente — no hay
 * cookie de sesión para visitantes públicos (las cookies httpOnly de admin
 * tienen path=/admin, ver lib/admin/session.ts), así que esto vive en
 * localStorage, no en una cookie del servidor.
 *
 * Mientras no haya consentimiento explícito, no se carga NINGÚN script de
 * terceros (AdSense) — ver components/legal/adsense-loader.tsx. Rechazar
 * es una opción real: no reduce funcionalidad del sitio, solo no muestra
 * anuncios personalizados.
 */

export type CookieConsent = "accepted" | "rejected";

const STORAGE_KEY = "cookie-consent";
const CHANGE_EVENT = "cookie-consent-change";

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "accepted" || value === "rejected" ? value : null;
}

export function setCookieConsent(consent: CookieConsent): void {
  window.localStorage.setItem(STORAGE_KEY, consent);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/**
 * Compatible con useSyncExternalStore (React 19): se dispara en el mismo
 * tab al llamar setCookieConsent (el evento "storage" del navegador NO se
 * dispara en el tab que hizo el cambio, solo en otros tabs). Usar
 * useSyncExternalStore en vez de useEffect+setState evita el
 * eslint react-hooks/set-state-in-effect y, más importante, deja que React
 * maneje la diferencia servidor (sin localStorage) vs. cliente sin warning
 * de hidratación.
 */
export function subscribeToCookieConsent(listener: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, listener);
  return () => window.removeEventListener(CHANGE_EVENT, listener);
}
