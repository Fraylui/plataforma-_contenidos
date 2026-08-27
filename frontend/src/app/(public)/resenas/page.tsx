import type { Metadata } from "next";
import { listPublishedReviews } from "@/lib/api/client";
import { ReviewCard } from "@/components/review/review-card";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 24;

export const metadata: Metadata = {
  title: "Reseñas",
  description: "Opiniones y calificaciones sobre lugares y experiencias de la región.",
};

export default async function ReviewsPage(props: PageProps<"/resenas">) {
  const { page: pageParam } = await props.searchParams;
  const page = typeof pageParam === "string" ? Math.max(0, parseInt(pageParam, 10) || 0) : 0;

  const result = await listPublishedReviews({ page, size: PAGE_SIZE });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">Reseñas</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Opiniones y calificaciones sobre lugares y experiencias de la región.
        </p>
      </header>

      <section className="mt-8" aria-label="Reseñas">
        {result.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            Todavía no hay reseñas publicadas.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              buildHref={(p) => `/resenas?page=${p}`}
            />
          </>
        )}
      </section>
    </div>
  );
}
