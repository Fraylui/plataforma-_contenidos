import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Category, EventSummary } from "@/lib/api/types";
import { AdBlock } from "@/components/legal/ad-block";
import { EventRowCard } from "./event-row-card";

const SECTION_TITLE = "flex items-center justify-between gap-3 text-sm font-bold tracking-tight text-foreground";
const SECTION_LINK =
  "inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-accent transition-colors hover:underline";
const SECTION = "p-5 sm:p-6";

/**
 * Barra lateral del home (fija en escritorio, arriba del feed en celular
 * para que no quede enterrada bajo un scroll infinito): agenda de próximos
 * eventos, un espacio de anuncio (AdSense, sección 43.2) y las categorías.
 *
 * Vive en UN solo panel con borde exterior (en vez de 3 secciones sueltas
 * flotando sobre el lienzo): con poco contenido (pocos eventos/categorías,
 * algo normal en un sitio recién lanzado) una lista suelta se ve "cortada"
 * apenas termina, dejando un vacío de fondo al lado del feed, que es mucho
 * más largo. Un panel con límite propio y `divide-y` entre secciones se
 * lee como un módulo completo sea cual sea su alto, no como algo que se
 * quedó a mitad de camino.
 */
export function HomeSidebar({
  events,
  categories,
  categoryNames,
}: {
  events: EventSummary[];
  categories: Category[];
  categoryNames: Record<string, string>;
}) {
  const topCategories = categories
    .filter((c) => c.parentId === null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  return (
    <div className="divide-y divide-foreground/[0.06] overflow-hidden rounded-2xl border border-foreground/[0.06] bg-surface shadow-[0_1px_2px_rgb(0_0_0_/_0.04),0_8px_20px_-12px_rgb(0_0_0_/_0.08)]">
      {events.length > 0 && (
        <section aria-labelledby="proximos-eventos" className={SECTION}>
          <div className={SECTION_TITLE}>
            <h2 id="proximos-eventos">Próximos eventos</h2>
            <Link href="/eventos" className={SECTION_LINK}>
              Agenda completa
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
          <ul className="mt-3 flex flex-col divide-y divide-foreground/[0.06]">
            {events.map((event) => (
              <li key={event.id}>
                <EventRowCard event={event} categoryName={categoryNames[event.categoryId]} compact bordered={false} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <AdBlock position="listing" className={SECTION} />

      {topCategories.length > 0 && (
        <section aria-labelledby="explorar-por-tema" className={SECTION}>
          <div className={SECTION_TITLE}>
            <h2 id="explorar-por-tema">Explorar por tema</h2>
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {topCategories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/categorias/${category.slug}`}
                  className="inline-block rounded-full border border-foreground/[0.08] bg-canvas px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
