import type { Metadata } from "next";
import { listPublishedPlaces } from "@/lib/api/client";
import { PlaceCard } from "@/components/place/place-card";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 24;

export const metadata: Metadata = {
  title: "Lugares",
  description: "Lugares, historia y ubicación — CONTEXTO.md sección 6.",
};

export default async function PlacesPage(props: PageProps<"/lugares">) {
  const { page: pageParam } = await props.searchParams;
  const page = typeof pageParam === "string" ? Math.max(0, parseInt(pageParam, 10) || 0) : 0;
  const result = await listPublishedPlaces({ page, size: PAGE_SIZE });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">Lugares</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Historia, ubicación y fotografías de los lugares que cubrimos.
        </p>
      </header>

      <section className="mt-10" aria-label="Lugares">
        {result.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            Todavía no hay lugares publicados. Vuelve pronto.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        )}
      </section>

      <Pagination page={result.page} totalPages={result.totalPages} buildHref={(p) => `/lugares?page=${p}`} />
    </div>
  );
}
