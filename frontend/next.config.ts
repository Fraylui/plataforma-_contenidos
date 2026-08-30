import type { NextConfig } from "next";

// Origen desde el que se sirven las imágenes (ImagePublicController, ver
// lib/image-url.ts) — necesario en img-src de la CSP porque son <img src>
// cross-origin, no proxeadas por Next.
const backendAssetOrigin = process.env.NEXT_PUBLIC_BACKEND_ASSET_URL ?? "http://localhost:8080";

// CONTEXTO.md secciones 17 y 39.2 ("cabeceras de seguridad... a nivel de
// edge") — no existían en absoluto hasta esta revisión.
//
// script-src lleva 'unsafe-inline' porque el propio bootstrap de hidratación
// de Next App Router inyecta <script> inline sin nonce (self.__next_f...) —
// bloquearlo rompe la hidratación de toda página. Los bloques JSON-LD
// (dangerouslySetInnerHTML, type="application/ld+json") no se ven afectados:
// los navegadores no los tratan como script ejecutable, así que no requieren
// 'unsafe-inline' aparte. Migrar a CSP con nonce (guía oficial de Next) es
// la mejora pendiente para eliminar 'unsafe-inline' de script-src.
// pagead2.googlesyndication.com/googleads.g.doubleclick.net: AdSense
// (components/legal/ad-slot.tsx) — hoy inertes hasta activar adsenseEnabled
// en Configuración, pero declarados ya para que no haga falta tocar esto al
// activarlos.
const CSP = [
  "default-src 'self'",
  `img-src 'self' data: ${backendAssetOrigin}`,
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  // 'unsafe-eval' solo en dev: Turbopack/React lo usan para reconstruir
  // stack traces (Fast Refresh, overlay de errores); nunca se emite en
  // producción, así que no debilita la CSP servida a usuarios reales.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""} https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net`,
  "connect-src 'self' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net",
  "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const backendAssetUrl = new URL(backendAssetOrigin);

const nextConfig: NextConfig = {
  // Imagen Docker (backend/Dockerfile hermano): empaqueta solo el server y
  // las dependencias de producción realmente usadas, no todo node_modules.
  output: "standalone",

  images: {
    // Solo el host de imágenes del backend (ImagePublicController) — los
    // logos de marca (platformSettings.logoUrl, host arbitrario definido
    // por el usuario en Configuración) siguen usando <img> plano a
    // propósito, no se puede allowlist-ear un host arbitrario acá.
    remotePatterns: [
      {
        protocol: backendAssetUrl.protocol.replace(":", "") as "http" | "https",
        hostname: backendAssetUrl.hostname,
        port: backendAssetUrl.port,
        pathname: "/api/v1/images/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          // frame-ancestors 'none' ya cubre esto en navegadores modernos;
          // X-Frame-Options queda como respaldo para los que no leen CSP.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
