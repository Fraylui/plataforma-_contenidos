import type { Metadata } from "next";
import { listPublishedArticles } from "@/lib/api/client";
import { ArticleCard } from "@/components/article/article-card";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 24;

export const metadata: Metadata = {
  title: "Artículos",
};

export default async function ArticlesPage(props: PageProps<"/articulos">) {
  const { page: pageParam } = await props.searchParams;
  const page = typeof pageParam === "string" ? Math.max(0, parseInt(pageParam, 10) || 0) : 0;
  const result = await listPublishedArticles({ page, size: PAGE_SIZE });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">Artículos</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Todo el contenido editorial publicado, más reciente primero.
        </p>
      </header>

      <section className="mt-10" aria-label="Artículos">
        {result.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            Todavía no hay artículos publicados. Vuelve pronto.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>

      <Pagination page={result.page} totalPages={result.totalPages} buildHref={(p) => `/articulos?page=${p}`} />
    </div>
  );
}
