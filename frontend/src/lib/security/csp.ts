// Content-Security-Policy del sitio, en un solo lugar (CONTEXTO.md §17, §39.2
// y §46.7). Dos variantes, porque Next App Router no permite otra cosa:
//
// - Sitio público: 'unsafe-inline' en script-src. El bootstrap de hidratación
//   de Next inyecta <script> inline (self.__next_f…) cuyo contenido cambia con
//   cada página, y esas páginas se sirven de caché (ISR): no hay petición en
//   la que poner un nonce. Probado 2026-10-22: con SRI (experimental.sri) y
//   sin 'unsafe-inline', Edge bloquea 10 scripts inline y la página no se
//   activa. Es la configuración «sin nonces» de la guía oficial de Next.
// - Panel (/admin): nonce por visita + 'strict-dynamic' (proxy.ts). El panel
//   ya se genera en cada visita (depende de la sesión), así que no pierde
//   caché, y es donde un XSS haría daño (actuar como el dueño).
//
// Los bloques JSON-LD (type="application/ld+json") no son script ejecutable:
// la CSP no los afecta.

const backendAssetOrigin = process.env.NEXT_PUBLIC_BACKEND_ASSET_URL ?? "http://localhost:8080";

interface CspOptions {
  /** Desarrollo: Turbopack/React usan eval para Fast Refresh y el overlay de errores. */
  dev: boolean;
}

// pagead2.googlesyndication.com/googleads.g.doubleclick.net: AdSense
// (components/legal/ad-slot.tsx), inerte hasta activarlo en Configuración.
// googletagmanager / google-analytics: Google Analytics 4, solo si el
// visitante acepta las cookies (AnalyticsLoader).
const THIRD_PARTY_SCRIPTS = "https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.googletagmanager.com";

function policy(scriptSrc: string): string {
  return [
    "default-src 'self'",
    // https: (no solo backendAssetOrigin): imágenes/logos por enlace externo
    // son un campo deliberado del panel — quien redacta pega cualquier host.
    // http: (sin "s") queda afuera a propósito: mixed content.
    `img-src 'self' data: ${backendAssetOrigin} https:`,
    "font-src 'self' data:",
    // Estilos inline: los usan Radix, el mapa y next/image (style="…").
    "style-src 'self' 'unsafe-inline'",
    `script-src ${scriptSrc}`,
    "connect-src 'self' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
    // youtube-nocookie.com: reproductor de videos y episodios; www.youtube.com:
    // chat de las transmisiones en vivo.
    "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://www.youtube-nocookie.com https://www.youtube.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

/** Sitio público (páginas en caché): ver arriba por qué lleva 'unsafe-inline'. */
export function publicCsp({ dev }: CspOptions): string {
  return policy(`'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""} ${THIRD_PARTY_SCRIPTS}`);
}

/**
 * Panel: solo corre lo que lleva el nonce de esta visita, y lo que eso cargue
 * ('strict-dynamic'). Los hosts de terceros no hacen falta: el panel no carga
 * AdSense ni Analytics, y con 'strict-dynamic' los navegadores los ignoran.
 */
export function adminCsp(nonce: string, { dev }: CspOptions): string {
  return policy(`'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`);
}
