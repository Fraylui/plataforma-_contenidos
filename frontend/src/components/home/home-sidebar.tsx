import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Category, EventSummary } from "@/lib/api/types";
import { AdBlock } from "@/components/legal/ad-block";
import { EventRowCard } from "./event-row-card";

const SECTION_TITLE = "flex items-center justify-between gap-3 text-sm font-bold tracking-tight text-foreground";
const SECTION_LINK =
  "inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-accent transition-colors hover:underline";

/**
 * Barra lateral del home (fija en escritorio, arriba del feed en celular
 * para que no quede enterrada bajo un scroll infinito): agenda de próximos
 * eventos en formato compacto, un espacio de anuncio (AdSense, sección
 * 43.2 — la barra lateral es la ubicación clásica de un anuncio que no
 * interrumpe la lectura) y las categorías como grilla estática. Reemplaza
 * dos secciones que iban al fondo de la página: "Próximos eventos" (tarjetas
 * grandes a 3 columnas) y "Categoría en foco" (una categoría rotando sola,
 * que se sentía torpe y solo mostraba un tema a la vez).
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
    <div className="flex flex-col gap-8">
      {events.length > 0 && (
        <section aria-labelledby="proximos-eventos">
          <div className={SECTION_TITLE}>
            <h2 id="proximos-eventos">Próximos eventos</h2>
            <Link href="/eventos" className={SECTION_LINK}>
              Agenda completa
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {events.map((event) => (
              <li key={event.id}>
                <EventRowCard event={event} categoryName={categoryNames[event.categoryId]} compact />
              </li>
            ))}
          </ul>
        </section>
      )}

      <AdBlock position="listing" />

      {topCategories.length > 0 && (
        <section aria-labelledby="explorar-por-tema">
          <div className={SECTION_TITLE}>
            <h2 id="explorar-por-tema">Explorar por tema</h2>
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {topCategories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/categorias/${category.slug}`}
                  className="inline-block rounded-full border border-canvas-border bg-surface px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent"
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
