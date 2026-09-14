import type { Metadata } from "next";
import { listActiveCategories, listPublishedReviews } from "@/lib/api/client";
import { ReviewCard } from "@/components/review/review-card";
import { Pagination } from "@/components/ui/pagination";
import { FilterMenu } from "@/components/filters/filter-menu";

const PAGE_SIZE = 24;
const BASE_PATH = "/resenas";

export const metadata: Metadata = {
  title: "Reseñas",
  description: "Opiniones y calificaciones sobre lugares y experiencias de la región.",
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

export default async function ReviewsPage(props: PageProps<"/resenas">) {
  const { page: pageParam, categoryId: categoryIdParam } = await props.searchParams;
  const page = typeof pageParam === "string" ? Math.max(0, parseInt(pageParam, 10) || 0) : 0;
  const categoryId = typeof categoryIdParam === "string" ? categoryIdParam : null;

  const [result, categories] = await Promise.all([
    listPublishedReviews({ page, size: PAGE_SIZE, categoryId: categoryId ?? undefined }),
    listActiveCategories(),
  ]);
  const categoryNames: Record<string, string> = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Reseñas</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Opiniones y calificaciones sobre lugares y experiencias de la región.
        </p>
      </header>

      <div className="mt-6 border-b border-foreground/[0.06] pb-4">
        <FilterMenu label="Filtrar por tema" allLabel="Todas las categorías" options={categories.map((c) => ({ value: c.id, label: c.name }))} activeValue={categoryId} paramName="categoryId" basePath={BASE_PATH} />
      </div>

      <section className="mt-8" aria-label="Reseñas">
        {result.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            {categoryId ? "Ninguna reseña publicada coincide con este filtro." : "Todavía no hay reseñas publicadas."}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {result.items.map((review, index) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  categoryName={categoryNames[review.categoryId]}
                  featured={page === 0 && index === 0}
                />
              ))}
            </div>
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              buildHref={(p) => buildHref(categoryId, p)}
            />
          </>
        )}
      </section>
    </div>
  );
}
