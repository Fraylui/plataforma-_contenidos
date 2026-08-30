import type { Metadata } from "next";
import { listActiveCategories, listPublishedReviews } from "@/lib/api/client";
import { ReviewCard } from "@/components/review/review-card";
import { Pagination } from "@/components/ui/pagination";
import { ListingFilters } from "@/components/filters/listing-filters";
import { resolveGeographyChain } from "@/lib/geography-chain";

const PAGE_SIZE = 24;
const BASE_PATH = "/resenas";

export const metadata: Metadata = {
  title: "Reseñas",
  description: "Opiniones y calificaciones sobre lugares y experiencias de la región.",
};

function buildHref(categoryId: string | null, geographyId: string | null, page: number): string {
  const params = new URLSearchParams();
  if (categoryId) params.set("categoryId", categoryId);
  if (geographyId) params.set("geographyId", geographyId);
  if (page > 0) params.set("page", String(page));
  const query = params.toString();
  return query ? `${BASE_PATH}?${query}` : BASE_PATH;
}

export default async function ReviewsPage(props: PageProps<"/resenas">) {
  const { page: pageParam, categoryId: categoryIdParam, geographyId: geographyIdParam } = await props.searchParams;
  const page = typeof pageParam === "string" ? Math.max(0, parseInt(pageParam, 10) || 0) : 0;
  const categoryId = typeof categoryIdParam === "string" ? categoryIdParam : null;
  const geographyId = typeof geographyIdParam === "string" ? geographyIdParam : null;

  const [result, categories, geographyChain] = await Promise.all([
    listPublishedReviews({ page, size: PAGE_SIZE, categoryId: categoryId ?? undefined, geographyId: geographyId ?? undefined }),
    listActiveCategories(),
    resolveGeographyChain(geographyId),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Reseñas</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Opiniones y calificaciones sobre lugares y experiencias de la región.
        </p>
      </header>

      <div className="mt-6">
        <ListingFilters basePath={BASE_PATH} categories={categories} initialGeographyChain={geographyChain} />
      </div>

      <section className="mt-8" aria-label="Reseñas">
        {result.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            {categoryId || geographyId ? "Ninguna reseña publicada coincide con este filtro." : "Todavía no hay reseñas publicadas."}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {result.items.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              buildHref={(p) => buildHref(categoryId, geographyId, p)}
            />
          </>
        )}
      </section>
    </div>
  );
}
