import Link from "next/link";
import { getPlatformSettings, listPublishedArticles, listPublishedEvents, listPublishedPlaces } from "@/lib/api/client";
import { ArticleCard } from "@/components/article/article-card";
import { PlaceCard } from "@/components/place/place-card";
import { EventCard } from "@/components/event/event-card";
import { articleTypeLabel } from "@/lib/content-labels";
import { imageUrl } from "@/lib/image-url";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";

const FEATURED_PLACES_SIZE = 4;
// +1: el primero se usa como destacado grande, el resto en la grilla — evita
// que el sitio se sienta un muro homogéneo de tarjetas idénticas (mismo
// criterio que usan los agregadores de contenido: jerarquía por tamaño, no
// solo por orden).
const RECENT_ARTICLES_SIZE = 7;
const UPCOMING_EVENTS_SIZE = 3;

export default async function Home() {
  const [articlesPage, placesPage, eventsPage, settings] = await Promise.all([
    listPublishedArticles({ size: RECENT_ARTICLES_SIZE }),
    listPublishedPlaces({ size: FEATURED_PLACES_SIZE }),
    listPublishedEvents({ when: "upcoming", size: UPCOMING_EVENTS_SIZE }),
    getPlatformSettings(),
  ]);
  const [featuredArticle, ...recentArticles] = articlesPage.items;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {settings.name}
        </h1>
        {settings.description && (
          <p className="mt-3 text-base leading-relaxed text-muted">{settings.description}</p>
        )}
      </header>

      {featuredArticle && (
        <Link
          href={`/articulos/${featuredArticle.slug}`}
          className="group mt-10 grid grid-cols-1 gap-6 overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-all duration-200 hover:border-accent hover:shadow-md sm:grid-cols-2"
        >
          <div className="aspect-video sm:aspect-auto">
            {featuredArticle.featuredImageId ? (
              // eslint-disable-next-line @next/next/no-img-element -- host propio del backend
              <img
                src={imageUrl(`/api/v1/images/${featuredArticle.featuredImageId}/file`)}
                alt={featuredArticle.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <NoImagePlaceholder />
            )}
          </div>
          <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
            <span className="text-xs font-medium tracking-wide text-accent uppercase">
              {articleTypeLabel(featuredArticle.articleType)}
            </span>
            <h2 className="text-2xl font-semibold leading-tight text-foreground transition-colors group-hover:text-accent sm:text-3xl">
              {featuredArticle.title}
            </h2>
            {featuredArticle.excerpt && (
              <p className="text-base leading-relaxed text-muted line-clamp-3">{featuredArticle.excerpt}</p>
            )}
          </div>
        </Link>
      )}

      {placesPage.items.length > 0 && (
        <section className="mt-12" aria-label="Lugares destacados">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Lugares destacados</h2>
            <Link href="/lugares" className="text-sm font-medium text-accent hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {placesPage.items.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </section>
      )}

      {eventsPage.items.length > 0 && (
        <section className="mt-12" aria-label="Próximos eventos">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Próximos eventos</h2>
            <Link href="/eventos" className="text-sm font-medium text-accent hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {eventsPage.items.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12" aria-label="Artículos recientes">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Artículos recientes</h2>
          {articlesPage.items.length > 0 && (
            <Link href="/articulos" className="text-sm font-medium text-accent hover:underline">
              Ver todos
            </Link>
          )}
        </div>
        {articlesPage.items.length === 0 ? (
          <EmptyState />
        ) : recentArticles.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Todavía no hay más artículos publicados.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recentArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-border px-6 py-16 text-center">
      <p className="text-sm text-muted">
        Todavía no hay artículos publicados. Vuelve pronto.
      </p>
    </div>
  );
}
