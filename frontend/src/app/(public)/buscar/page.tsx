import type { Metadata } from "next";
import { listActiveCategories, searchContent } from "@/lib/api/client";
import type { SearchResultType } from "@/lib/api/types";
import { SearchResultCard } from "@/components/search/search-result-card";
import { FilterMenu } from "@/components/filters/filter-menu";
import { EventDateRangeFilter } from "@/components/search/event-date-range-filter";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 24;
const BASE_PATH = "/buscar";

const TYPE_OPTIONS: { value: SearchResultType; label: string }[] = [
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
    typeParam === "REVIEW" ||
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Sin campo de búsqueda propio a propósito: el buscador del header ya
          está siempre visible arriba y manda a esta misma página al
          escribir y dar Enter — tener otro cuadro igual acá abajo era
          literalmente el mismo control repetido dos veces en la misma
          pantalla (encontrado probando el buscador real). Para cambiar de
          término, se usa el del header. */}
      <header className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {query ? <>Resultados para «{query}»</> : "Buscar"}
        </h1>
      </header>

      {query && (
        <div className="mt-6 space-y-4">
          {/* Dos desplegables compactos, no chips fijas: antes esto eran dos
              filas apiladas (tipo Y categoría, cada una con hasta 7
              pastillas) más 5 selectores de geografía en cascada debajo —
              se sentía un formulario, no una búsqueda. Las opciones de
              "tipo" además repetían palabra por palabra los enlaces de la
              navegación principal (Publicaciones/Lugares/Eventos/...),
              puro ruido visual sin aportar nada nuevo al lado de esos
              mismos enlaces ya visibles arriba. La geografía se sacó por
              completo: no aportaba lo suficiente para el espacio que ocupaba. */}
          <div className="flex flex-wrap items-center gap-2 border-b border-foreground/[0.06] pb-4">
            <FilterMenu
              label="Todo el contenido"
              allLabel="Todo el contenido"
              options={TYPE_OPTIONS}
              activeValue={type}
              paramName="type"
              basePath={BASE_PATH}
              extraParams={{ q: query, ...(categoryId ? { categoryId } : {}) }}
            />
            <FilterMenu
              label="Filtrar por tema"
              allLabel="Todas las categorías"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              activeValue={categoryId}
              paramName="categoryId"
              basePath={BASE_PATH}
              extraParams={{ q: query, ...(type ? { type } : {}) }}
            />
          </div>

          {type === "EVENT" && (
            <EventDateRangeFilter
              q={query}
              categoryId={categoryId}
              from={from}
              to={to}
              clearHref={buildHref(query, type, categoryId, null, null, 0)}
            />
          )}
        </div>
      )}

      <section className="mt-8" aria-label="Resultados de búsqueda">
        {!query ? (
          <p className="text-sm text-muted">Escribe algo en el buscador de arriba para buscar en todo el contenido publicado.</p>
        ) : result && result.items.length > 0 ? (
          <>
            <p className="mb-6 text-sm text-muted">
              {result.totalElements} resultado{result.totalElements === 1 ? "" : "s"}
            </p>
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
          <p className="text-sm text-muted">Sin resultados para «{query}». Prueba con otras palabras.</p>
        )}
      </section>
    </div>
  );
}
