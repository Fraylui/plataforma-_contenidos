import type { Metadata } from "next";
import { listActiveCategories, listPublishedArticles } from "@/lib/api/client";
import { ArticleCard } from "@/components/article/article-card";
import { Pagination } from "@/components/ui/pagination";
import { AdBlock } from "@/components/legal/ad-block";
import { CategoryChips } from "@/components/filters/category-chips";

const PAGE_SIZE = 24;
const BASE_PATH = "/publicaciones";

export const metadata: Metadata = {
  title: "Publicaciones",
  // Sin esto hereda el canonical "/" del layout raíz (bug real hallado con
  // Lighthouse/lhci: SEO le decía a los buscadores que esta página era
  // duplicado del home).
  alternates: { canonical: BASE_PATH },
};

function buildHref(categoryId: string | null, page: number): string {
  const params = new URLSearchParams();
  if (categoryId) params.set("categoryId", categoryId);
  if (page > 0) params.set("page", String(page));
  const query = params.toString();
  return query ? `${BASE_PATH}?${query}` : BASE_PATH;
}

export default async function ArticlesPage(props: PageProps<"/publicaciones">) {
  const { page: pageParam, categoryId: categoryIdParam } = await props.searchParams;
  const page = typeof pageParam === "string" ? Math.max(0, parseInt(pageParam, 10) || 0) : 0;
  const categoryId = typeof categoryIdParam === "string" ? categoryIdParam : null;

  const [result, categories] = await Promise.all([
    listPublishedArticles({ page, size: PAGE_SIZE, categoryId: categoryId ?? undefined }),
    listActiveCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Publicaciones</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Todo el contenido publicado, más reciente primero.
        </p>
      </header>

      <div className="mt-6">
        <CategoryChips categories={categories} activeCategoryId={categoryId} buildHref={(catId) => buildHref(catId, 0)} />
      </div>

      <section className="mt-8" aria-label="Publicaciones">
        {result.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            {categoryId ? "Ninguna publicación coincide con este filtro." : "Todavía no hay publicaciones. Vuelve pronto."}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.items.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>

      <div className="mt-10">
        <AdBlock position="listing" />
      </div>

      <Pagination page={result.page} totalPages={result.totalPages} buildHref={(p) => buildHref(categoryId, p)} />
    </div>
  );
}
