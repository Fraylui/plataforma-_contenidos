import Link from "next/link";
import { CalendarHeart } from "lucide-react";
import type { OnThisDayItem } from "@/lib/api/types";
import { formatMemorableDate, onThisDayKicker, onThisDayTitle } from "@/lib/on-this-day";
import { serverImageUrl } from "@/lib/server-image-url";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";
import { SkeletonImage } from "@/components/ui/skeleton-image";

/**
 * "Un día como hoy" en la portada: fila horizontal de tarjetas grandes con
 * la imagen a sangre (patrón de fila de Netflix), deslizable con el dedo
 * en celular. Lo de hoy primero, después lo de los próximos días. Sin
 * contenido con fecha memorable en la semana, la franja no existe.
 */
export function OnThisDayStrip({ items }: { items: OnThisDayItem[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="un-dia-como-hoy" className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 id="un-dia-como-hoy" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        <CalendarHeart className="h-5 w-5 text-accent" aria-hidden="true" />
        {onThisDayTitle(items)}
      </h2>
      <ul className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [scrollbar-width:thin]">
        {items.map((item) => {
          const { article } = item;
          return (
            <li key={article.id} className="w-[78%] shrink-0 snap-start sm:w-[44%] lg:w-[31%]">
              <Link
                href={`/publicaciones/${article.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-canvas-strong sm:aspect-[4/3]"
              >
                {article.coverImageId ? (
                  <SkeletonImage
                    src={serverImageUrl(`/api/v1/images/${article.coverImageId}/file`)}
                    alt=""
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    sizes="(min-width: 1024px) 31vw, (min-width: 640px) 44vw, 78vw"
                  />
                ) : article.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- enlace externo pegado por quien redacta, host arbitrario
                  <img src={article.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <NoImagePlaceholder />
                )}
                {/* Degradado para que el texto se lea sobre cualquier foto. */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" aria-hidden="true" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-4 sm:p-5">
                  <span className="w-fit rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white uppercase backdrop-blur-sm">
                    {onThisDayKicker(item)}
                  </span>
                  <span className="line-clamp-3 text-lg font-bold leading-snug text-white sm:text-xl">{article.title}</span>
                  {article.memorableDay != null && article.memorableMonth != null && (
                    <span className="text-xs text-white/80">
                      {formatMemorableDate(article.memorableDay, article.memorableMonth, article.memorableYear)}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
