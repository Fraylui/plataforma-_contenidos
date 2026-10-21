"use client";

/* eslint-disable @next/next/no-img-element -- vistas previas con URLs arbitrarias (externas o del backend), sin optimizar */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { WarningCircle } from "@phosphor-icons/react";

/**
 * Imagen de las vistas previas del panel que no muestra el ícono roto del
 * navegador: si el enlace no carga, muestra `fallback` y avisa con
 * `onError`. También detecta lo que falló antes de hidratar (el evento ya
 * pasó: imagen completa sin ancho).
 */
export function PreviewImage({
  src,
  fallback,
  onError,
  className = "size-full object-cover",
}: {
  src: string;
  fallback: ReactNode;
  onError?: () => void;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const ref = useRef<HTMLImageElement>(null);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  });

  useEffect(() => {
    const image = ref.current;
    if (image?.complete && image.naturalWidth === 0) {
      setFailedSrc(src);
      onErrorRef.current?.();
    }
  }, [src]);

  if (failedSrc === src) return <>{fallback}</>;
  return (
    <img
      ref={ref}
      src={src}
      alt=""
      className={className}
      onError={() => {
        setFailedSrc(src);
        onError?.();
      }}
    />
  );
}

/** Fondo para una portada que no cargó: se lee qué pasó en vez de ver un ícono roto. */
export function BrokenImageNotice({ compact = false }: { compact?: boolean }) {
  return (
    <span role="img" aria-label="No se pudo cargar la imagen" className="flex size-full flex-col items-center justify-center gap-1 bg-warning-soft p-2 text-center text-warning">
      <WarningCircle aria-hidden="true" className={compact ? "size-5" : "size-7"} />
      {!compact && <span className="text-xs font-medium">No se pudo cargar la imagen</span>}
    </span>
  );
}
