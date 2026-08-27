import type { Metadata } from "next";
import { searchContent } from "@/lib/api/client";
import { SearchResultCard } from "@/components/search/search-result-card";

export const metadata: Metadata = {
  title: "Buscar",
  // Sección 15: páginas de resultados de búsqueda no aportan valor a un buscador externo.
  robots: "noindex,follow",
};

export default async function SearchPage(props: PageProps<"/buscar">) {
  const { q } = await props.searchParams;
  const query = typeof q === "string" ? q : "";
  const page = query ? await searchContent(query) : null;

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

      <section className="mt-10" aria-label="Resultados de búsqueda">
        {!query ? (
          <p className="text-sm text-muted">Escribe algo para buscar en todo el contenido publicado.</p>
        ) : page && page.items.length > 0 ? (
          <>
            <p className="mb-6 text-sm text-muted">
              {page.totalElements} resultado{page.totalElements === 1 ? "" : "s"} para «{query}»
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {page.items.map((result) => (
                <SearchResultCard key={`${result.contentType}-${result.id}`} result={result} />
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">Sin resultados para «{query}». Prueba con otras palabras.</p>
        )}
      </section>
    </div>
  );
}
