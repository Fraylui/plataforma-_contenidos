import type { Metadata } from "next";
import Link from "next/link";
import { searchContent } from "@/lib/api/client";
import type { SearchResultType } from "@/lib/api/types";
import { SearchResultCard } from "@/components/search/search-result-card";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 24;

const TYPE_TABS: { value: SearchResultType | null; label: string }[] = [
  { value: null, label: "Todo" },
  { value: "ARTICLE", label: "Artículos" },
  { value: "PLACE", label: "Lugares" },
  { value: "EVENT", label: "Eventos" },
  { value: "GALLERY", label: "Galerías" },
];

export const metadata: Metadata = {
  title: "Buscar",
  // Sección 15: páginas de resultados de búsqueda no aportan valor a un buscador externo.
  robots: "noindex,follow",
};

function buildHref(query: string, type: SearchResultType | null, page: number): string {
  const params = new URLSearchParams({ q: query });
  if (type) params.set("type", type);
  if (page > 0) params.set("page", String(page));
  return `/buscar?${params.toString()}`;
}

export default async function SearchPage(props: PageProps<"/buscar">) {
  const { q, type: typeParam, page: pageParam } = await props.searchParams;
  const query = typeof q === "string" ? q : "";
  const type =
    typeParam === "ARTICLE" || typeParam === "PLACE" || typeParam === "EVENT" || typeParam === "GALLERY"
      ? typeParam
      : null;
  const page = typeof pageParam === "string" ? Math.max(0, parseInt(pageParam, 10) || 0) : 0;
  const result = query ? await searchContent(query, { page, size: PAGE_SIZE, type: type ?? undefined }) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
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
        <nav aria-label="Filtrar por tipo" className="mt-6 flex gap-2">
          {TYPE_TABS.map((tab) => {
            const active = tab.value === type;
            return (
              <Link
                key={tab.label}
                href={buildHref(query, tab.value, 0)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? "bg-accent text-accent-foreground" : "bg-surface text-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      )}

      <section className="mt-8" aria-label="Resultados de búsqueda">
        {!query ? (
          <p className="text-sm text-muted">Escribe algo para buscar en todo el contenido publicado.</p>
        ) : result && result.items.length > 0 ? (
          <>
            <p className="mb-6 text-sm text-muted">
              {result.totalElements} resultado{result.totalElements === 1 ? "" : "s"} para «{query}»
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((item) => (
                <SearchResultCard key={`${item.contentType}-${item.id}`} result={item} />
              ))}
            </div>
            <Pagination page={result.page} totalPages={result.totalPages} buildHref={(p) => buildHref(query, type, p)} />
          </>
        ) : (
          <p className="text-sm text-muted">Sin resultados para «{query}». Prueba con otras palabras.</p>
        )}
      </section>
    </div>
  );
}
