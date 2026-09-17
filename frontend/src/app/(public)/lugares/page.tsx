import type { Metadata } from "next";
import { listActiveCategories, listPublishedPlaces } from "@/lib/api/client";
import { PlaceCard } from "@/components/place/place-card";
import { Pagination } from "@/components/ui/pagination";
import { AdBlock } from "@/components/legal/ad-block";
import { FilterMenu } from "@/components/filters/filter-menu";

const PAGE_SIZE = 24;
const BASE_PATH = "/lugares";

export const metadata: Metadata = {
  title: "Lugares",
  description: "Lugares, historia y ubicación — CONTEXTO.md sección 6.",
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

export default async function PlacesPage(props: PageProps<"/lugares">) {
  const { page: pageParam, categoryId: categoryIdParam } = await props.searchParams;
  const page = typeof pageParam === "string" ? Math.max(0, parseInt(pageParam, 10) || 0) : 0;
  const categoryId = typeof categoryIdParam === "string" ? categoryIdParam : null;

  const [result, categories] = await Promise.all([
    listPublishedPlaces({ page, size: PAGE_SIZE, categoryId: categoryId ?? undefined }),
    listActiveCategories(),
  ]);
  const categoryNames: Record<string, string> = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Lugares</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Historia, ubicación y fotografías de los lugares que cubrimos.
        </p>
      </header>

      <div className="mt-6 border-b border-foreground/[0.06] pb-4">
        <FilterMenu label="Filtrar por tema" allLabel="Todas las categorías" options={categories.map((c) => ({ value: c.id, label: c.name }))} activeValue={categoryId} paramName="categoryId" basePath={BASE_PATH} />
      </div>

      <div className="mt-8">
        <AdBlock position="cabecera" className="aspect-[5/1] sm:aspect-[8/1]" />
      </div>

      <section className="mt-8" aria-label="Lugares">
        {result.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            {categoryId ? "Ningún lugar publicado coincide con este filtro." : "Todavía no hay lugares publicados. Vuelve pronto."}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.items.map((place, index) => (
              <PlaceCard
                key={place.id}
                place={place}
                categoryName={categoryNames[place.categoryId]}
                featured={page === 0 && index === 0}
              />
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
