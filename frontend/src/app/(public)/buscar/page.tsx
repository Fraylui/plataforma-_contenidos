import type { Metadata } from "next";
import Link from "next/link";
import { listActiveCategories, searchContent } from "@/lib/api/client";
import { resolveGeographyChain } from "@/lib/geography-chain";
import type { SearchResultType } from "@/lib/api/types";
import { SearchResultCard } from "@/components/search/search-result-card";
import { CategoryChips } from "@/components/filters/category-chips";
import { GeographyFilter } from "@/components/search/geography-filter";
import { EventDateRangeFilter } from "@/components/search/event-date-range-filter";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 24;

const TYPE_TABS: { value: SearchResultType | null; label: string }[] = [
  { value: null, label: "Todo" },
  { value: "ARTICLE", label: "Publicaciones" },
  { value: "PLACE", label: "Lugares" },
  { value: "EVENT", label: "Eventos" },
  { value: "GALLERY", label: "Galerías" },
  { value: "REVIEW", label: "Reseñas" },
  { value: "BUSINESS", label: "Directorio" },
];

export const metadata: Metadata = {
  title: "Buscar",
  // Sección 15: páginas de resultados de búsqueda no aportan valor a un buscador externo.
  robots: "noindex,follow",
};

function buildHref(
  query: string,
  type: SearchResultType | null,
  categoryId: string | null,
  geographyId: string | null,
  from: string | null,
  to: string | null,
  page: number,
): string {
  const params = new URLSearchParams({ q: query });
  if (type) params.set("type", type);
  if (categoryId) params.set("categoryId", categoryId);
  if (geographyId) params.set("geographyId", geographyId);
  if (type === "EVENT" && from) params.set("from", from);
  if (type === "EVENT" && to) params.set("to", to);
  if (page > 0) params.set("page", String(page));
  return `/buscar?${params.toString()}`;
}

export default async function SearchPage(props: PageProps<"/buscar">) {
  const {
    q,
    type: typeParam,
    page: pageParam,
    categoryId: categoryIdParam,
    geographyId: geographyIdParam,
    from: fromParam,
    to: toParam,
  } = await props.searchParams;
  const query = typeof q === "string" ? q : "";
  const type =
    typeParam === "ARTICLE" ||
    typeParam === "PLACE" ||
    typeParam === "EVENT" ||
    typeParam === "GALLERY" ||
    typeParam === "REVIEW" ||
    typeParam === "BUSINESS"
      ? typeParam
      : null;
  const page = typeof pageParam === "string" ? Math.max(0, parseInt(pageParam, 10) || 0) : 0;
  const categoryId = typeof categoryIdParam === "string" ? categoryIdParam : null;
  const geographyId = typeof geographyIdParam === "string" ? geographyIdParam : null;
  // Los inputs type="date" mandan "YYYY-MM-DD" — se completan a un instante
  // ISO recién acá, al armar la llamada real al backend; la URL se queda con
  // la fecha simple (más limpia para compartir/editar a mano).
  const from = typeof fromParam === "string" && fromParam ? fromParam : null;
  const to = typeof toParam === "string" && toParam ? toParam : null;
  const fromInstant = type === "EVENT" && from ? `${from}T00:00:00Z` : undefined;
  const toInstant = type === "EVENT" && to ? `${to}T23:59:59Z` : undefined;

  const [result, categories, geographyChain] = await Promise.all([
    query
      ? searchContent(query, {
          page,
          size: PAGE_SIZE,
          type: type ?? undefined,
          categoryId: categoryId ?? undefined,
          geographyId: geographyId ?? undefined,
          from: fromInstant,
          to: toInstant,
        })
      : Promise.resolve(null),
    listActiveCategories(),
    resolveGeographyChain(geographyId),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Buscar
        </h1>
        <form action="/buscar" className="mt-6 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Buscar contenido…"
            autoFocus
            className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-base text-foreground outline-none focus-visible:border-accent"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            Buscar
          </button>
        </form>
      </header>

      {query && (
        <div className="mt-6 space-y-4">
          <nav aria-label="Filtrar por tipo" className="flex flex-wrap gap-2">
            {TYPE_TABS.map((tab) => {
              const active = tab.value === type;
              return (
                <Link
                  key={tab.label}
                  href={buildHref(query, tab.value, categoryId, geographyId, from, to, 0)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    active ? "bg-accent text-accent-foreground" : "bg-surface text-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>

          <CategoryChips
            categories={categories}
            activeCategoryId={categoryId}
            buildHref={(catId) => buildHref(query, type, catId, geographyId, from, to, 0)}
          />

          <GeographyFilter initialChain={geographyChain} />

          {type === "EVENT" && (
            <EventDateRangeFilter
              q={query}
              categoryId={categoryId}
              geographyId={geographyId}
              from={from}
              to={to}
              clearHref={buildHref(query, type, categoryId, geographyId, null, null, 0)}
            />
          )}
        </div>
      )}

      <section className="mt-8" aria-label="Resultados de búsqueda">
        {!query ? (
          <p className="text-sm text-muted">Escribe algo para buscar en todo el contenido publicado.</p>
        ) : result && result.items.length > 0 ? (
          <>
            <p className="mb-6 text-sm text-muted">
              {result.totalElements} resultado{result.totalElements === 1 ? "" : "s"} para «{query}»
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {result.items.map((item) => (
                <SearchResultCard key={`${item.contentType}-${item.id}`} result={item} query={query} />
              ))}
            </div>
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              buildHref={(p) => buildHref(query, type, categoryId, geographyId, from, to, p)}
            />
          </>
        ) : (
          <p className="text-sm text-muted">Sin resultados para «{query}». Prueba con otras palabras.</p>
        )}
      </section>
    </div>
  );
}
