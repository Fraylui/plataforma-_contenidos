import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug, listPublishedArticles, listPublishedEvents, listPublishedPlaces } from "@/lib/api/client";
import { ArticleCard } from "@/components/article/article-card";
import { PlaceCard } from "@/components/place/place-card";
import { EventCard } from "@/components/event/event-card";
import { Pagination } from "@/components/ui/pagination";

const FEATURED_PLACES_SIZE = 4;
const UPCOMING_EVENTS_SIZE = 3;
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

  const [placesResult, eventsResult, articlesResult] = await Promise.all([
    listPublishedPlaces({ categoryId: category.id, size: FEATURED_PLACES_SIZE }),
    listPublishedEvents({ categoryId: category.id, when: "upcoming", size: UPCOMING_EVENTS_SIZE }),
    listPublishedArticles({ categoryId: category.id, page, size: ARTICLES_PAGE_SIZE }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
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
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-3 text-base leading-relaxed text-muted">{category.description}</p>
        )}
      </header>

      {placesResult.items.length > 0 && (
        <section className="mt-12" aria-label="Lugares">
          <h2 className="font-serif text-xl font-medium text-foreground">Lugares</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {placesResult.items.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </section>
      )}

      {eventsResult.items.length > 0 && (
        <section className="mt-12" aria-label="Próximos eventos">
          <h2 className="font-serif text-xl font-medium text-foreground">Próximos eventos</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {eventsResult.items.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12" aria-label="Artículos">
        <h2 className="font-serif text-xl font-medium text-foreground">Artículos</h2>
        {articlesResult.items.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            Todavía no hay artículos publicados en esta categoría.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
