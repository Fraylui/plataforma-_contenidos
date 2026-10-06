import type { Metadata } from "next";
import { listActiveCategories, searchContent } from "@/lib/api/client";
import type { SearchResultType } from "@/lib/api/types";
import { SearchResultCard } from "@/components/search/search-result-card";
import { SearchSuggestions } from "@/components/search/search-suggestions";
import { FilterChips } from "@/components/feed/filter-chips";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { EventDateRangeFilter } from "@/components/search/event-date-range-filter";
import { Pagination } from "@/components/ui/pagination";

/** Con menos resultados que esto, la búsqueda sugiere temas y lo más reciente. */
const SUGGEST_BELOW = 4;

const PAGE_SIZE = 24;
const BASE_PATH = "/buscar";

const TYPE_OPTIONS: { value: SearchResultType; label: string }[] = [
  { value: "ARTICLE", label: "Publicaciones" },
  { value: "PLACE", label: "Lugares" },
  { value: "EVENT", label: "Eventos" },
  { value: "GALLERY", label: "Galerías" },
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
  from: string | null,
  to: string | null,
  page: number,
): string {
  const params = new URLSearchParams({ q: query });
  if (type) params.set("type", type);
  if (categoryId) params.set("categoryId", categoryId);
  if (type === "EVENT" && from) params.set("from", from);
  if (type === "EVENT" && to) params.set("to", to);
  if (page > 0) params.set("page", String(page));
  return `${BASE_PATH}?${params.toString()}`;
}

export default async function SearchPage(props: PageProps<"/buscar">) {
  const { q, type: typeParam, page: pageParam, categoryId: categoryIdParam, from: fromParam, to: toParam } =
    await props.searchParams;
  const query = typeof q === "string" ? q : "";
  const type =
    typeParam === "ARTICLE" ||
    typeParam === "PLACE" ||
    typeParam === "EVENT" ||
    typeParam === "GALLERY" ||
    typeParam === "BUSINESS"
      ? typeParam
      : null;
  const page = typeof pageParam === "string" ? Math.max(0, parseInt(pageParam, 10) || 0) : 0;
  const categoryId = typeof categoryIdParam === "string" ? categoryIdParam : null;
  // Los inputs type="date" mandan "YYYY-MM-DD" — se completan a un instante
  // ISO recién acá, al armar la llamada real al backend; la URL se queda con
  // la fecha simple (más limpia para compartir/editar a mano).
  const from = typeof fromParam === "string" && fromParam ? fromParam : null;
  const to = typeof toParam === "string" && toParam ? toParam : null;
  const fromInstant = type === "EVENT" && from ? `${from}T00:00:00Z` : undefined;
  const toInstant = type === "EVENT" && to ? `${to}T23:59:59Z` : undefined;

  const [result, categories] = await Promise.all([
    query
      ? searchContent(query, {
          page,
          size: PAGE_SIZE,
          type: type ?? undefined,
          categoryId: categoryId ?? undefined,
          from: fromInstant,
          to: toInstant,
        })
      : Promise.resolve(null),
    listActiveCategories(),
  ]);
  const categoryNames: Record<string, string> = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const typeChips = [
    { label: "Todo", href: buildHref(query, null, categoryId, null, null, 0), active: type === null },
    ...TYPE_OPTIONS.map((option) => ({
      label: option.label,
      href: buildHref(query, option.value, categoryId, null, null, 0),
      active: type === option.value,
    })),
  ];
  const topicChips = [
    { label: "Todos los temas", href: buildHref(query, type, null, from, to, 0), active: categoryId === null },
    ...categories.map((c) => ({ label: c.name, href: buildHref(query, type, c.id, from, to, 0), active: categoryId === c.id })),
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      {/* Pestaña "Buscar" en celular: campo propio arriba, como el buscador de
          Instagram (la barra superior en celular solo tiene una lupa). En
          escritorio el buscador ya está siempre visible arriba. Formulario
          GET: funciona sin JavaScript. */}
      <form action={BASE_PATH} role="search" className="mb-4 sm:hidden">
        <label htmlFor="buscar-q" className="sr-only">
          Buscar contenido
        </label>
        <div className="flex h-11 items-center rounded-full bg-canvas-strong focus-within:ring-4 focus-within:ring-accent/15">
          <MagnifyingGlass className="ml-4 h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
          <input
            id="buscar-q"
            name="q"
            type="search"
            defaultValue={query}
            enterKeyHint="search"
            placeholder="Buscar lugares, eventos, publicaciones…"
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground placeholder-muted outline-none"
          />
        </div>
      </form>

      {query && (
        <div className="mb-4">
          <h1 className="text-lg font-bold text-foreground sm:text-xl">
            «{query}»
            {result && (
              <span className="ml-2 text-sm font-medium text-muted">
                {result.totalElements.toLocaleString("es")} {result.totalElements === 1 ? "resultado" : "resultados"}
              </span>
            )}
          </h1>
          <FilterChips label="Tipo de contenido" options={typeChips} className="mt-3" />
          <FilterChips label="Tema" options={topicChips} className="mt-1" />
        </div>
      )}
      {!query && <h1 className="sr-only">Buscar</h1>}

      {query && type === "EVENT" && (
        <div className="mt-4">
          <EventDateRangeFilter
            q={query}
            categoryId={categoryId}
            from={from}
            to={to}
            clearHref={buildHref(query, type, categoryId, null, null, 0)}
          />
        </div>
      )}

      <section className="mt-8" aria-label="Resultados de búsqueda">
        {!query ? (
          <p className="px-6 py-16 text-center text-sm text-muted">
            Busca lugares, eventos, publicaciones, galerías o negocios.
          </p>
        ) : result && result.items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {result.items.map((item) => (
                <SearchResultCard
                  key={`${item.contentType}-${item.id}`}
                  result={item}
                  query={query}
                  categoryName={item.categoryId ? categoryNames[item.categoryId] : undefined}
                />
              ))}
            </div>
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              buildHref={(p) => buildHref(query, type, categoryId, from, to, p)}
            />
          </>
        ) : (
          <p className="rounded-lg border border-dashed border-border px-6 py-10 text-center text-sm text-muted">
            Sin resultados para «{query}». Prueba con otras palabras o explora estas sugerencias.
          </p>
        )}

        {/* Pocos o ningún resultado: nunca una página casi vacía (ver SearchSuggestions). */}
        {query && result && result.totalElements < SUGGEST_BELOW && (
          <SearchSuggestions
            query={query}
            categories={categories}
            categoryNames={categoryNames}
            excludeIds={result.items.map((item) => item.id)}
            hasResults={result.items.length > 0}
          />
        )}
      </section>
    </div>
  );
}
