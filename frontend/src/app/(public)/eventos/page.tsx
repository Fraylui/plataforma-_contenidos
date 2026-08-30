import type { Metadata } from "next";
import Link from "next/link";
import { listActiveCategories, listPublishedEvents } from "@/lib/api/client";
import { EventCard } from "@/components/event/event-card";
import { Pagination } from "@/components/ui/pagination";
import { ListingFilters } from "@/components/filters/listing-filters";
import { resolveGeographyChain } from "@/lib/geography-chain";

const PAGE_SIZE = 24;
const BASE_PATH = "/eventos";

const WHEN_TABS: { value: "upcoming" | "past"; label: string }[] = [
  { value: "upcoming", label: "Próximos" },
  { value: "past", label: "Pasados" },
];

export const metadata: Metadata = {
  title: "Eventos",
  description: "Eventos próximos y pasados de la región.",
};

function buildHref(
  when: "upcoming" | "past",
  categoryId: string | null,
  geographyId: string | null,
  page: number,
): string {
  const params = new URLSearchParams({ when });
  if (categoryId) params.set("categoryId", categoryId);
  if (geographyId) params.set("geographyId", geographyId);
  if (page > 0) params.set("page", String(page));
  return `${BASE_PATH}?${params.toString()}`;
}

export default async function EventsPage(props: PageProps<"/eventos">) {
  const {
    when: whenParam,
    page: pageParam,
    categoryId: categoryIdParam,
    geographyId: geographyIdParam,
  } = await props.searchParams;
  const when = whenParam === "past" ? "past" : "upcoming";
  const page = typeof pageParam === "string" ? Math.max(0, parseInt(pageParam, 10) || 0) : 0;
  const categoryId = typeof categoryIdParam === "string" ? categoryIdParam : null;
  const geographyId = typeof geographyIdParam === "string" ? geographyIdParam : null;

  const [result, categories, geographyChain] = await Promise.all([
    listPublishedEvents({ when, page, size: PAGE_SIZE, categoryId: categoryId ?? undefined, geographyId: geographyId ?? undefined }),
    listActiveCategories(),
    resolveGeographyChain(geographyId),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Eventos</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Ferias, festivales y actividades — próximas y pasadas.
        </p>
      </header>

      <nav aria-label="Filtrar por fecha" className="mt-6 flex gap-2">
        {WHEN_TABS.map((tab) => {
          const active = tab.value === when;
          return (
            <Link
              key={tab.value}
              href={buildHref(tab.value, categoryId, geographyId, 0)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                active ? "bg-accent text-accent-foreground" : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4">
        <ListingFilters basePath={BASE_PATH} categories={categories} initialGeographyChain={geographyChain} />
      </div>

      <section className="mt-8" aria-label="Eventos">
        {result.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            {categoryId || geographyId
              ? "Ningún evento coincide con este filtro."
              : when === "upcoming"
                ? "Todavía no hay eventos próximos."
                : "Todavía no hay eventos pasados."}
          </p>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
              {result.items.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              buildHref={(p) => buildHref(when, categoryId, geographyId, p)}
            />
          </>
        )}
      </section>
    </div>
  );
}
