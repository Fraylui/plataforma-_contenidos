import { SkeletonImage } from "@/components/ui/skeleton-image";
import type { HomeItem } from "@/lib/home-items";

/** La foto de un lugar llenando su contenedor (relativo): subida (next/image) o enlace externo. */
export function CoverImage({ item, sizes, priority = false }: { item: HomeItem; sizes: string; priority?: boolean }) {
  const cover = item.images[0] ?? (item.imageUrl ? { url: item.imageUrl, isExternal: item.imageIsExternal } : null);
  if (!cover) return <div className="absolute inset-0 bg-linear-to-br from-brand-from to-brand-to" />;
  if (cover.isExternal) {
    // eslint-disable-next-line @next/next/no-img-element -- enlace externo pegado en el panel, host arbitrario
    return <img src={cover.url} alt="" loading={priority ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover" />;
  }
  return <SkeletonImage src={cover.url} alt="" sizes={sizes} className="object-cover" priority={priority} />;
}
