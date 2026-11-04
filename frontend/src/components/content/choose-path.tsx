import Link from "next/link";
import { ArrowRight, Compass, Layers, Sparkles, type LucideIcon } from "lucide-react";
import { getFeed } from "@/lib/api/client";
import type { FeedItem, FeedItemType } from "@/lib/api/types";
import { choosePaths, countPaths } from "@/lib/choose-path";
import { serverImageUrl } from "@/lib/server-image-url";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";
import { SkeletonImage } from "@/components/ui/skeleton-image";

const POOL_SIZE = 24;

const HREF_PREFIX: Record<FeedItemType, string> = {
  ARTICLE: "/publicaciones",
  PLACE: "/lugares",
  EVENT: "/eventos",
};

/** La puerta "otro formato" dice qué ofrece ese formato, no el nombre técnico del tipo. */
const OTHER_FORM_LABEL: Record<FeedItemType, string> = {
  ARTICLE: "Conoce la historia",
  PLACE: "Visita el lugar",
  EVENT: "Vívelo en persona",
};

/**
 * "Elige tu camino" al pie del contenido (ver lib/choose-path.ts): tres
 * puertas con intención distinta en vez de "más de lo mismo", para que
 * terminar de leer sea el comienzo del siguiente recorrido y no la salida
 * del sitio. Va dentro del flujo de lectura, justo después de reaccionar
 * o compartir — el momento en que el lector decide si sigue o se va.
 * Con menos de 2 puertas reales no se muestra (no hay nada que elegir).
 */
export async function ChoosePath({
  currentId,
  currentType,
  categoryId,
  categoryName,
  related,
  categoryNames,
}: {
  currentId: string;
  currentType: FeedItemType;
  categoryId: string | null;
  categoryName: string | null;
  related: FeedItem[];
  categoryNames: Record<string, string>;
}) {
  const pool = await getFeed({ size: POOL_SIZE, exclude: [currentId] })
    .then((page) => page.items)
    .catch(() => []);
  const paths = choosePaths({ currentId, currentType, categoryId, related, pool });
  if (countPaths(paths) < 2) return null;

  const doors: { item: FeedItem; label: string; icon: LucideIcon }[] = [];
  if (paths.deeper) {
    doors.push({ item: paths.deeper, label: categoryName ? `Más de ${categoryName}` : "Más del tema", icon: Layers });
  }
  if (paths.otherForm) {
    doors.push({ item: paths.otherForm, label: OTHER_FORM_LABEL[paths.otherForm.type], icon: Compass });
  }
  if (paths.surprise) {
    doors.push({ item: paths.surprise, label: "Sorpréndeme", icon: Sparkles });
  }

  return (
    <nav aria-labelledby="choose-path-title" className="mt-12 border-t border-border pt-8">
      <h2 id="choose-path-title" className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
        ¿Por dónde sigues?
      </h2>
      <p className="mt-1 text-sm text-muted">Elige tu camino: más a fondo, en otro formato o algo totalmente distinto.</p>
      <ul className={`mt-5 grid grid-cols-1 gap-3 ${doors.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {doors.map(({ item, label, icon: Icon }) => (
          <li key={item.id}>
            <Link
              href={`${HREF_PREFIX[item.type]}/${item.slug}`}
              className="group flex h-full flex-row overflow-hidden rounded-2xl border border-foreground/[0.06] bg-surface shadow-[0_1px_2px_rgb(0_0_0_/_0.04),0_8px_20px_-12px_rgb(0_0_0_/_0.08)] transition-[border-color,box-shadow] hover:border-accent/50 hover:shadow-md sm:flex-col"
            >
              <div className="relative w-24 shrink-0 overflow-hidden bg-canvas-strong sm:aspect-video sm:w-full">
                {item.coverImageId ? (
                  <SkeletonImage
                    src={serverImageUrl(`/api/v1/images/${item.coverImageId}/file`)}
                    alt=""
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    sizes="(min-width: 640px) 33vw, 96px"
                  />
                ) : item.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- enlace externo pegado por quien redacta, host arbitrario
                  <img src={item.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <NoImagePlaceholder />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3 sm:p-4">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-accent uppercase">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {label}
                </span>
                <span className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-accent sm:text-[15px]">
                  {item.title}
                </span>
                {item.categoryId && categoryNames[item.categoryId] && (
                  <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs text-muted">
                    {categoryNames[item.categoryId]}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
