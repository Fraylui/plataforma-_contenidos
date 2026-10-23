import type { NextConfig } from "next";
import { publicCsp } from "./src/lib/security/csp";

// Origen desde el que el NAVEGADOR pide las imágenes (ImagePublicController,
// ver lib/image-url.ts); también va en img-src de la CSP (src/lib/security/csp.ts).
const backendAssetOrigin = process.env.NEXT_PUBLIC_BACKEND_ASSET_URL ?? "http://localhost:8080";
const backendAssetUrl = new URL(backendAssetOrigin);

// Host que el SERVIDOR de Next puede resolver para el fetch interno de
// /_next/image (lib/server-image-url.ts) — en Docker es el nombre del
// servicio en la red interna del compose (http://backend:8080), NUNCA
// backendAssetOrigin: ese es el host que el NAVEGADOR del visitante puede
// alcanzar (localhost:8080 vía el puerto publicado), y no existe desde
// dentro del contenedor del frontend. Usar backendAssetOrigin para ambos
// causaba 400 Bad Request en /_next/image en producción (el optimizador
// intentaba conectarse a su propio "localhost", donde no hay nada
// escuchando) — encontrado inspeccionando la consola del sitio real.
//
// OJO: no se puede usar BACKEND_API_URL acá — esa variable vale otra cosa
// en build time (red "host" del build, ver docker-compose.yml) que en
// runtime (red interna del compose), y remotePatterns es config ESTÁTICA
// horneada en build time: para cuando el server corre en runtime con
// BACKEND_API_URL=http://backend:8080, ya es tarde para cambiar el
// allowlist. RUNTIME_BACKEND_INTERNAL_URL es el mismo valor en ambas fases
// a propósito, solo para esto.
const serverBackendOrigin = process.env.RUNTIME_BACKEND_INTERNAL_URL ?? "http://localhost:8080";
const serverBackendUrl = new URL(serverBackendOrigin);

const nextConfig: NextConfig = {
  // Imagen Docker (backend/Dockerfile hermano): empaqueta solo el server y
  // las dependencias de producción realmente usadas, no todo node_modules.
  output: "standalone",

  images: {
    // Next bloquea por defecto (protección SSRF, ver
    // fetchExternalImage/isPrivateIp en next/dist/server/image-optimizer.js)
    // cualquier host que resuelva a una IP privada — "backend" en la red de
    // Docker Compose resuelve a un 172.x.x.x, así que sin esto /_next/image
    // devuelve 400 "url parameter is not allowed" pese a que el hostname sí
    // está en remotePatterns. Es seguro acá porque el único host adicional
    // permitido es el propio backend, fijo por remotePatterns más abajo —
    // no se abre a cualquier IP privada arbitraria, solo a la nuestra.
    dangerouslyAllowLocalIP: true,
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
      {
        protocol: serverBackendUrl.protocol.replace(":", "") as "http" | "https",
        hostname: serverBackendUrl.hostname,
        port: serverBackendUrl.port,
        pathname: "/api/v1/images/**",
      },
    ],
  },

  // /articulos -> /publicaciones: renombrado 2026-08-30 (ver feedback_no_articulo_editorial_naming).
  // Redirect 301 para no perder el SEO de URLs ya indexadas bajo el nombre anterior.
  async redirects() {
    return [
      { source: "/articulos", destination: "/publicaciones", permanent: true },
      { source: "/articulos/:slug", destination: "/publicaciones/:slug", permanent: true },
      // /eventos y /agenda -> /celebraciones (2026-10-16): «Eventos» sonaba a publicidad; el modelo es el de
      // Google (la portada cambia el día que toca + un archivo de celebraciones).
      { source: "/eventos", destination: "/celebraciones", permanent: true },
      { source: "/eventos/:slug", destination: "/celebraciones/:slug", permanent: true },
      { source: "/agenda", destination: "/celebraciones", permanent: true },
      { source: "/agenda/:slug", destination: "/celebraciones/:slug", permanent: true },
      // Panel con lenguaje de plataforma (2026-10-06): las URLs viejas siguen funcionando.
      { source: "/admin/categorias/nueva", destination: "/admin/temas/nuevo", permanent: true },
      { source: "/admin/publicidad/nueva", destination: "/admin/espacios/nuevo", permanent: true },
      { source: "/admin/medios/:path*", destination: "/admin/imagenes/:path*", permanent: true },
      { source: "/admin/categorias/:path*", destination: "/admin/temas/:path*", permanent: true },
      { source: "/admin/publicidad/:path*", destination: "/admin/espacios/:path*", permanent: true },
      { source: "/admin/auditoria/:path*", destination: "/admin/actividad/:path*", permanent: true },
      { source: "/admin/usuarios/nuevo", destination: "/admin/trabajadores/nuevo", permanent: true },
      { source: "/admin/usuarios/:path*", destination: "/admin/trabajadores/:path*", permanent: true },
    ];
  },

  async headers() {
    return [
      {
        // El panel lleva su propia CSP con nonce por visita (src/proxy.ts).
        source: "/((?!admin(?:/|$)).*)",
        headers: [{ key: "Content-Security-Policy", value: publicCsp({ dev: process.env.NODE_ENV !== "production" }) }],
      },
      {
        source: "/:path*",
        headers: [
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
