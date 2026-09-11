import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  listActiveCategories,
  listPublishedArticles,
  listPublishedEvents,
  listPublishedGalleries,
  listPublishedPlaces,
  listPublishedReviews,
} from "@/lib/api/client";
import { fromArticle, fromEvent, fromGallery, fromPlace, fromReview, sortNewestFirst } from "@/lib/home-items";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";
import { SkeletonImage } from "@/components/ui/skeleton-image";

export const metadata: Metadata = {
  title: "Categorías",
  description: "Explorá el contenido por categoría — CONTEXTO.md sección 4.",
};

// Una sola tanda de listados (no una consulta por categoría): se reparte
// entre todas las categorías para elegir una portada representativa y un
// conteo real por categoría, en vez de mostrar solo nombres.
const SAMPLE_SIZE = 48;

export default async function CategoriesPage() {
  const [categories, articles, places, events, galleries, reviews] = await Promise.all([
    listActiveCategories(),
    listPublishedArticles({ size: SAMPLE_SIZE }),
    listPublishedPlaces({ size: SAMPLE_SIZE }),
    listPublishedEvents({ when: "upcoming", size: SAMPLE_SIZE }),
    listPublishedGalleries({ size: SAMPLE_SIZE }),
    listPublishedReviews({ size: SAMPLE_SIZE }),
  ]);

  const allItems = sortNewestFirst([
    ...articles.items.map(fromArticle),
    ...places.items.map(fromPlace),
    ...events.items.map(fromEvent),
    ...galleries.items.map(fromGallery),
    ...reviews.items.map(fromReview),
  ]);

  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const withContent = sorted
    .map((category) => {
      const items = allItems.filter((item) => item.categoryId === category.id);
      return { category, items, cover: items.find((item) => item.imageUrl) ?? items[0] };
    })
    .filter((entry) => entry.items.length > 0);
  const empty = sorted.filter((category) => !allItems.some((item) => item.categoryId === category.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Categorías</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Todo el contenido del sitio, agrupado por tema — la portada de cada tarjeta es el contenido más reciente de esa categoría.
        </p>
      </header>

      {withContent.length === 0 && empty.length === 0 ? (
        <p className="mt-10 rounded-lg border border-dashed border-canvas-border px-6 py-16 text-center text-sm text-muted">
          Todavía no hay categorías activas.
        </p>
      ) : (
        <>
          {withContent.length > 0 && (
            <section className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 lg:grid-cols-3" aria-label="Categorías con contenido">
              {withContent.map(({ category, items, cover }) => (
                <Link
                  key={category.id}
                  href={`/categorias/${category.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-canvas-border bg-surface shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-canvas-strong">
                    {cover?.imageUrl ? (
                      <SkeletonImage
                        src={cover.imageUrl}
                        alt=""
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                        sizes="(min-width: 1024px) 30vw, 50vw"
                      />
                    ) : (
                      <NoImagePlaceholder />
                    )}
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-6 pb-2.5 sm:px-4 sm:pb-3">
                      <span className="text-base font-bold tracking-tight text-white sm:text-lg">{category.name}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3">
                    <span className="text-xs text-muted sm:text-sm">
                      {items.length} contenido{items.length === 1 ? "" : "s"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent transition-transform group-hover:translate-x-0.5 sm:text-sm">
                      Ver
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ))}
            </section>
          )}

          {empty.length > 0 && (
            <section className="mt-10" aria-label="Otras categorías">
              <h2 className="text-xs font-semibold tracking-wider text-muted uppercase">Otras categorías</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {empty.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categorias/${category.slug}`}
                    className="inline-flex h-9 items-center rounded-full border border-canvas-border bg-surface px-3.5 text-sm font-medium text-foreground transition-colors hover:border-accent/60 hover:text-accent"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
