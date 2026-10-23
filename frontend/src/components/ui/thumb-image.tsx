import Image from "next/image";

/** Fotos subidas al backend: las únicas que el optimizador de Next acepta (remotePatterns en next.config.ts). */
const UPLOADED = "/api/v1/images/";

/**
 * Miniatura decorativa (burbujas de temas, avatares): siempre en diferido.
 * Antes eran <img> con la foto original (hasta 1600×900) y sin lazy, y React
 * las precargaba todas en el <head>: 11 fotos grandes compitiendo con la foto
 * principal en el Inicio (Lighthouse CI, 2026-10-22). Una foto subida se pide
 * al optimizador a su tamaño (WebP de unos pocos KB); un enlace externo (host
 * arbitrario, no se puede optimizar) va directo, con prioridad baja.
 */
export function ThumbImage({ src, size, className }: { src: string; size: number; className?: string }) {
  if (src.includes(UPLOADED)) {
    return <Image src={src} alt="" width={size} height={size} loading="lazy" className={className} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- enlace externo pegado en el panel, host arbitrario
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      fetchPriority="low"
      className={className}
    />
  );
}
