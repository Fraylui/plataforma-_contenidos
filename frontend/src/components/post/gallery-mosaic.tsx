/* eslint-disable @next/next/no-img-element -- miniaturas: enlace externo o imagen subida, sin optimizar en el mosaico */
import Link from "next/link";
import type { HomeImage } from "@/lib/home-items";
import { SkeletonImage } from "@/components/ui/skeleton-image";

/**
 * Galería en el feed como mosaico (dueño 2026-10-21, «sorpréndeme»): una foto
 * grande y dos chicas, y cuántas faltan, en vez de una sola foto con puntitos.
 * Mismo cuadrado 1:1 que el resto de las tarjetas (sin saltos al cargar).
 */
export function GalleryMosaic({ images, title, href, priority = false }: { images: HomeImage[]; title: string; href: string; priority?: boolean }) {
  const shown = images.slice(0, 3);
  const rest = images.length - shown.length;
  return (
    <Link
      href={href}
      aria-label={`Ver las ${images.length} fotos de ${title}`}
      className="grid aspect-square grid-cols-3 grid-rows-2 gap-0.5 overflow-hidden bg-canvas-strong"
    >
      {shown.map((image, index) => (
        <span key={`${image.url}-${index}`} className={index === 0 ? "relative col-span-2 row-span-2" : "relative"}>
          {image.isExternal ? (
            <img
              src={image.url}
              alt=""
              loading={priority && index === 0 ? "eager" : "lazy"}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <SkeletonImage
              src={image.url}
              alt=""
              sizes={index === 0 ? "(min-width: 640px) 420px, 66vw" : "(min-width: 640px) 210px, 33vw"}
              priority={priority && index === 0}
              className="object-cover"
            />
          )}
          {index === 2 && rest > 0 && (
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-black/45 text-2xl font-extrabold text-white">
              +{rest}
            </span>
          )}
        </span>
      ))}
    </Link>
  );
}
