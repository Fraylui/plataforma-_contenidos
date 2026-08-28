import type { Metadata } from "next";
import { listActiveCategories, listPublishedArticles } from "@/lib/api/client";
import { ArticleCard } from "@/components/article/article-card";
import { Pagination } from "@/components/ui/pagination";
import { AdBlock } from "@/components/legal/ad-block";
import { ListingFilters } from "@/components/filters/listing-filters";
import { resolveGeographyChain } from "@/lib/geography-chain";

const PAGE_SIZE = 24;
const BASE_PATH = "/articulos";

export const metadata: Metadata = {
  title: "Artículos",
};

function buildHref(categoryId: string | null, geographyId: string | null, page: number): string {
  const params = new URLSearchParams();
  if (categoryId) params.set("categoryId", categoryId);
  if (geographyId) params.set("geographyId", geographyId);
  if (page > 0) params.set("page", String(page));
  const query = params.toString();
  return query ? `${BASE_PATH}?${query}` : BASE_PATH;
}

export default async function ArticlesPage(props: PageProps<"/articulos">) {
  const { page: pageParam, categoryId: categoryIdParam, geographyId: geographyIdParam } = await props.searchParams;
  const page = typeof pageParam === "string" ? Math.max(0, parseInt(pageParam, 10) || 0) : 0;
  const categoryId = typeof categoryIdParam === "string" ? categoryIdParam : null;
  const geographyId = typeof geographyIdParam === "string" ? geographyIdParam : null;

  const [result, categories, geographyChain] = await Promise.all([
    listPublishedArticles({ page, size: PAGE_SIZE, categoryId: categoryId ?? undefined, geographyId: geographyId ?? undefined }),
    listActiveCategories(),
    resolveGeographyChain(geographyId),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">Artículos</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Todo el contenido editorial publicado, más reciente primero.
        </p>
      </header>

      <div className="mt-6">
        <ListingFilters basePath={BASE_PATH} categories={categories} initialGeographyChain={geographyChain} />
      </div>

      <section className="mt-8" aria-label="Artículos">
        {result.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            {categoryId || geographyId
              ? "Ningún artículo publicado coincide con este filtro."
              : "Todavía no hay artículos publicados. Vuelve pronto."}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>

      <div className="mt-10">
        <AdBlock position="listing" />
      </div>

      <Pagination page={result.page} totalPages={result.totalPages} buildHref={(p) => buildHref(categoryId, geographyId, p)} />
    </div>
  );
}
