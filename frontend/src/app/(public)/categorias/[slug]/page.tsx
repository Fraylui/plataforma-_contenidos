import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategoryBySlug,
  listPublishedArticles,
  listPublishedBusinesses,
  listPublishedEvents,
  listPublishedGalleries,
  listPublishedPlaces,
  listPublishedReviews,
} from "@/lib/api/client";
import { ArticleCard } from "@/components/article/article-card";
import { PlaceCard } from "@/components/place/place-card";
import { EventCard } from "@/components/event/event-card";
import { GalleryCard } from "@/components/gallery/gallery-card";
import { ReviewCard } from "@/components/review/review-card";
import { BusinessCard } from "@/components/directory/business-card";
import { Pagination } from "@/components/ui/pagination";

const FEATURED_PLACES_SIZE = 4;
const UPCOMING_EVENTS_SIZE = 3;
const FEATURED_GALLERIES_SIZE = 3;
const FEATURED_REVIEWS_SIZE = 3;
const FEATURED_BUSINESSES_SIZE = 3;
const ARTICLES_PAGE_SIZE = 24;

export async function generateMetadata(props: PageProps<"/categorias/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description || `Artículos y lugares de ${category.name}.`,
  };
}

export default async function CategoryPage(props: PageProps<"/categorias/[slug]">) {
  const { slug } = await props.params;
  const { page: pageParam } = await props.searchParams;
  const page = typeof pageParam === "string" ? Math.max(0, parseInt(pageParam, 10) || 0) : 0;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [placesResult, eventsResult, galleriesResult, reviewsResult, businessesResult, articlesResult] =
    await Promise.all([
      listPublishedPlaces({ categoryId: category.id, size: FEATURED_PLACES_SIZE }),
      listPublishedEvents({ categoryId: category.id, when: "upcoming", size: UPCOMING_EVENTS_SIZE }),
      listPublishedGalleries({ categoryId: category.id, size: FEATURED_GALLERIES_SIZE }),
      listPublishedReviews({ categoryId: category.id, size: FEATURED_REVIEWS_SIZE }),
      listPublishedBusinesses({ categoryId: category.id, size: FEATURED_BUSINESSES_SIZE }),
      listPublishedArticles({ categoryId: category.id, page, size: ARTICLES_PAGE_SIZE }),
    ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-accent hover:underline">
              Inicio
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/categorias" className="hover:text-accent hover:underline">
              Categorías
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground/80" aria-current="page">
            {category.name}
          </li>
        </ol>
      </nav>

      <header className="mt-3 max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-3 text-base leading-relaxed text-muted">{category.description}</p>
        )}
      </header>

      {placesResult.items.length > 0 && (
        <section className="mt-12" aria-label="Lugares">
          <h2 className="text-xl font-semibold text-foreground">Lugares</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {placesResult.items.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </section>
      )}

      {eventsResult.items.length > 0 && (
        <section className="mt-12" aria-label="Próximos eventos">
          <h2 className="text-xl font-semibold text-foreground">Próximos eventos</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {eventsResult.items.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {galleriesResult.items.length > 0 && (
        <section className="mt-12" aria-label="Galerías">
          <h2 className="text-xl font-semibold text-foreground">Galerías</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {galleriesResult.items.map((gallery) => (
              <GalleryCard key={gallery.id} gallery={gallery} />
            ))}
          </div>
        </section>
      )}

      {reviewsResult.items.length > 0 && (
        <section className="mt-12" aria-label="Reseñas">
          <h2 className="text-xl font-semibold text-foreground">Reseñas</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {reviewsResult.items.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </section>
      )}

      {businessesResult.items.length > 0 && (
        <section className="mt-12" aria-label="Directorio">
          <h2 className="text-xl font-semibold text-foreground">Directorio</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {businessesResult.items.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12" aria-label="Publicaciones">
        <h2 className="text-xl font-semibold text-foreground">Publicaciones</h2>
        {articlesResult.items.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            Todavía no hay artículos publicados en esta categoría.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {articlesResult.items.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
        <Pagination
          page={articlesResult.page}
          totalPages={articlesResult.totalPages}
          buildHref={(p) => `/categorias/${slug}?page=${p}`}
        />
      </section>
    </div>
  );
}
