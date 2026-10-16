import Link from "next/link";
import { CalendarBlank, Heart } from "@phosphor-icons/react/dist/ssr";
import type { CelebrationSummary } from "@/lib/api/types";
import type { HomeItem } from "@/lib/home-items";
import { celebrationDateParts, formatCelebrationDate } from "@/lib/celebration-date";
import { serverImageUrl } from "@/lib/server-image-url";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import { AdBlock } from "@/components/legal/ad-block";
import type { AdSection } from "@/lib/ads/ad-context";

/** Fila de la columna: píldora de fondo al pasar el mouse, sin bordes ni líneas (como Facebook). */
const ROW = "group -mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface";

function SectionHeader({ id, title, href }: { id: string; title: string; href?: string }) {
  return (
    <div className="mb-1 flex items-center justify-between">
      <h2 id={id} className="text-[17px] font-semibold text-muted">
        {title}
      </h2>
      {href && (
        <Link href={href} className="rounded-md px-2 py-1 text-sm font-medium text-accent transition-colors hover:bg-surface">
          Ver todo
        </Link>
      )}
    </div>
  );
}

function CelebrationRow({ celebration, categoryName }: { celebration: CelebrationSummary; categoryName?: string }) {
  const { day, month } = celebrationDateParts(celebration.nextOccurrenceAt);
  const where = celebration.venueName ?? categoryName;

  return (
    <Link href={`/celebraciones/${celebration.slug}`} className={ROW}>
      {/* Miniatura con la fecha encima (como los eventos de Facebook): foto y día en un solo bloque. */}
      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-accent-soft">
        {celebration.coverImageId ? (
          <SkeletonImage src={serverImageUrl(`/api/v1/images/${celebration.coverImageId}/file`)} alt="" className="object-cover" sizes="64px" />
        ) : celebration.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- enlace externo pegado por quien redacta, host arbitrario
          <img src={celebration.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <CalendarBlank className="absolute top-2 left-1/2 h-5 w-5 -translate-x-1/2 text-accent" aria-hidden="true" />
        )}
        <span className="absolute inset-x-1 bottom-1 flex items-baseline justify-center gap-0.5 rounded-lg bg-surface/95 py-0.5 text-foreground shadow-sm">
          <span className="text-sm leading-none font-black">{day}</span>
          <span className="text-[10px] leading-none font-semibold text-muted">{month}</span>
        </span>
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="line-clamp-2 text-[15px] leading-snug font-semibold text-foreground">{celebration.title}</span>
        <span className="truncate text-[13px] text-muted">
          <time dateTime={celebration.nextOccurrenceAt}>
            {formatCelebrationDate({ at: celebration.nextOccurrenceAt, allDay: celebration.allDay, recursYearly: celebration.recursYearly, sinceYear: celebration.sinceYear })}
          </time>
          {where && ` · ${where}`}
        </span>
      </span>
    </Link>
  );
}

/**
 * Columna derecha del feed en escritorio ancho (≥ 1280 px), como la de
 * Facebook: pegada al borde derecho de la pantalla (sin franjas vacías a
 * los costados), títulos grises, filas con píldora al pasar el mouse y sin
 * tarjetas ni líneas. Próximos eventos, lo más gustado y un anuncio. En
 * celular, las celebraciones están en «Más» y dentro del feed.
 */
export function RightColumn({
  celebrations,
  topLiked,
  categoryNames,
  adSection = "HOME",
}: {
  celebrations: CelebrationSummary[];
  topLiked: HomeItem[];
  categoryNames: Record<string, string>;
  adSection?: AdSection;
}) {
  return (
    <div className="flex flex-col gap-7">
      {celebrations.length > 0 && (
        <section aria-labelledby="proximas-celebraciones">
          <SectionHeader id="proximas-celebraciones" title="Próximas celebraciones" href="/celebraciones" />
          <ul className="flex flex-col">
            {celebrations.map((celebration) => (
              <li key={celebration.id}>
                <CelebrationRow celebration={celebration} categoryName={categoryNames[celebration.categoryId]} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {topLiked.length >= 3 && (
        <section aria-labelledby="lo-mas-gustado">
          <SectionHeader id="lo-mas-gustado" title="Lo más gustado" />
          <ol className="flex flex-col">
            {topLiked.slice(0, 5).map((item, index) => (
              <li key={item.id}>
                <Link href={item.href} className={ROW}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-black text-accent tabular-nums">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-[15px] leading-snug font-semibold text-foreground">{item.title}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-[13px] text-muted tabular-nums">
                      <Heart className="h-3.5 w-3.5 text-red-500" weight="fill" aria-hidden="true" />
                      {item.likeCount.toLocaleString("es")} me gusta
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
      <AdBlock position="listing" layout="fill" section={adSection} />
    </div>
  );
}
