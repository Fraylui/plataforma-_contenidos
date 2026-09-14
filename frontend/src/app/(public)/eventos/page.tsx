import type { Metadata } from "next";
import Link from "next/link";
import { listActiveCategories, listPublishedEvents } from "@/lib/api/client";
import { EventCard } from "@/components/event/event-card";
import { Pagination } from "@/components/ui/pagination";
import { FilterMenu } from "@/components/filters/filter-menu";

const PAGE_SIZE = 24;
const BASE_PATH = "/eventos";

const WHEN_TABS: { value: "upcoming" | "past"; label: string }[] = [
  { value: "upcoming", label: "Próximos" },
  { value: "past", label: "Pasados" },
];

export const metadata: Metadata = {
  title: "Eventos",
  description: "Eventos próximos y pasados de la región.",
  // Sin esto hereda el canonical "/" del layout raíz (bug real hallado con
  // Lighthouse/lhci: SEO le decía a los buscadores que esta página era
  // duplicado del home).
  alternates: { canonical: BASE_PATH },
};

function buildHref(when: "upcoming" | "past", categoryId: string | null, page: number): string {
  const params = new URLSearchParams({ when });
  if (categoryId) params.set("categoryId", categoryId);
  if (page > 0) params.set("page", String(page));
  return `${BASE_PATH}?${params.toString()}`;
}

export default async function EventsPage(props: PageProps<"/eventos">) {
  const { when: whenParam, page: pageParam, categoryId: categoryIdParam } = await props.searchParams;
  const when = whenParam === "past" ? "past" : "upcoming";
  const page = typeof pageParam === "string" ? Math.max(0, parseInt(pageParam, 10) || 0) : 0;
  const categoryId = typeof categoryIdParam === "string" ? categoryIdParam : null;

  const [result, categories] = await Promise.all([
    listPublishedEvents({ when, page, size: PAGE_SIZE, categoryId: categoryId ?? undefined }),
    listActiveCategories(),
  ]);
  const categoryNames: Record<string, string> = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Eventos</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Ferias, festivales y actividades — próximas y pasadas.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-foreground/[0.06] pb-4">
        <nav aria-label="Filtrar por fecha" className="flex gap-2">
          {WHEN_TABS.map((tab) => {
            const active = tab.value === when;
            return (
              <Link
                key={tab.value}
                href={buildHref(tab.value, categoryId, 0)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "border border-foreground/[0.08] text-muted hover:border-accent/50 hover:text-foreground"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <span className="h-5 w-px bg-foreground/[0.08]" aria-hidden="true" />
        <FilterMenu
          label="Filtrar por tema"
          allLabel="Todas las categorías"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          activeValue={categoryId}
          paramName="categoryId"
          basePath={BASE_PATH}
          extraParams={{ when }}
        />
      </div>

      <section className="mt-8" aria-label="Eventos">
        {result.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            {categoryId
              ? "Ningún evento coincide con este filtro."
              : when === "upcoming"
                ? "Todavía no hay eventos próximos."
                : "Todavía no hay eventos pasados."}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {result.items.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  categoryName={categoryNames[event.categoryId]}
                  featured={page === 0 && index === 0}
                />
              ))}
            </div>
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              buildHref={(p) => buildHref(when, categoryId, p)}
            />
          </>
        )}
      </section>
    </div>
  );
}
