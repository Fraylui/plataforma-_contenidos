import Link from "next/link";
import { getPlatformSettings, listPublishedArticles, listPublishedEvents, listPublishedPlaces } from "@/lib/api/client";
import { ArticleCard } from "@/components/article/article-card";
import { PlaceCard } from "@/components/place/place-card";
import { EventCard } from "@/components/event/event-card";
import { articleTypeLabel } from "@/lib/content-labels";
import { imageUrl } from "@/lib/image-url";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";

const FEATURED_PLACES_SIZE = 4;
// El primero se usa como destacado grande, el resto en la grilla — evita
// que el sitio se sienta un muro homogéneo de tarjetas idénticas (mismo
// criterio que usan los agregadores de contenido: jerarquía por tamaño, no
// solo por orden).
const RECENT_ARTICLES_SIZE = 8;
const UPCOMING_EVENTS_SIZE = 3;
// El destacado rota entre los más recientes en vez de ser siempre el mismo
// (a pedido del usuario, "como lo hacen las grandes empresas para no aburrir
// a la gente") — pero con más peso para el más nuevo, nunca un pick 100%
// parejo entre todos: newsrooms grandes rotan el hero, no randomizan el
// listado completo (eso rompe la lectura "más nuevo primero").
const FEATURED_POOL_SIZE = 5;

/** Pick al azar ponderado: el índice 0 (más reciente) pesa más que el último del pool. */
function pickWeightedFeatured<T>(pool: T[]): { featured: T; rest: T[] } {
  const weights = pool.map((_, i) => pool.length - i);
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * total;
  let index = 0;
  for (; index < pool.length; index++) {
    roll -= weights[index];
    if (roll <= 0) break;
  }
  const featured = pool[index];
  const rest = pool.filter((_, i) => i !== index);
  return { featured, rest };
}

export default async function Home() {
  const [articlesPage, placesPage, eventsPage, settings] = await Promise.all([
    listPublishedArticles({ size: RECENT_ARTICLES_SIZE }),
    listPublishedPlaces({ size: FEATURED_PLACES_SIZE }),
    listPublishedEvents({ when: "upcoming", size: UPCOMING_EVENTS_SIZE }),
    getPlatformSettings(),
  ]);
  const pool = articlesPage.items.slice(0, FEATURED_POOL_SIZE);
  const overflow = articlesPage.items.slice(FEATURED_POOL_SIZE);
  const { featured: featuredArticle, rest: poolRest } = pool.length > 0
    ? pickWeightedFeatured(pool)
    : { featured: undefined, rest: [] };
  const recentArticles = [...poolRest, ...overflow];

  return (
    <div>
      <div className="bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <header className="max-w-2xl">
            <div className="h-1 w-12 rounded-full bg-accent" aria-hidden="true" />
            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{settings.name}</h1>
            {settings.description && (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-background/70 sm:text-base">
                {settings.description}
              </p>
            )}
          </header>

          {featuredArticle && (
            <Link
              href={`/articulos/${featuredArticle.slug}`}
              className="group mt-6 grid grid-cols-1 gap-4 overflow-hidden rounded-xl bg-surface text-foreground shadow-sm transition-shadow duration-200 hover:shadow-md sm:grid-cols-2"
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
              <div className="flex flex-col justify-center gap-2 p-5 sm:p-6">
                <span className="w-fit rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold tracking-wide text-accent uppercase">
                  {articleTypeLabel(featuredArticle.articleType)}
                </span>
                <h2 className="text-xl font-bold leading-tight tracking-tight transition-colors group-hover:text-accent sm:text-2xl">
                  {featuredArticle.title}
                </h2>
                {featuredArticle.excerpt && (
                  <p className="text-sm leading-relaxed text-muted line-clamp-3">{featuredArticle.excerpt}</p>
                )}
              </div>
            </Link>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {placesPage.items.length > 0 && (
        <section aria-label="Lugares destacados">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Lugares destacados</h2>
            <Link href="/lugares" className="rounded-full border border-accent px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-foreground">
              Ver todos
            </Link>
          </div>
          <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:snap-none sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
            {placesPage.items.map((place) => (
              <div key={place.id} className="w-60 shrink-0 snap-start sm:w-auto sm:shrink">
                <PlaceCard place={place} />
              </div>
            ))}
          </div>
        </section>
      )}

      {eventsPage.items.length > 0 && (
        <section className="mt-10" aria-label="Próximos eventos">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Próximos eventos</h2>
            <Link href="/eventos" className="rounded-full border border-accent px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-foreground">
              Ver todos
            </Link>
          </div>
          <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:snap-none sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 sm:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
            {eventsPage.items.map((event) => (
              <div key={event.id} className="w-72 shrink-0 snap-start sm:w-auto sm:shrink">
                <EventCard event={event} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10" aria-label="Publicaciones recientes">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Publicaciones recientes</h2>
          {articlesPage.items.length > 0 && (
            <Link href="/articulos" className="rounded-full border border-accent px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-foreground">
              Ver todos
            </Link>
          )}
        </div>
        {articlesPage.items.length === 0 ? (
          <EmptyState />
        ) : recentArticles.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Todavía no hay más artículos publicados.</p>
        ) : (
          <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:snap-none sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 sm:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
            {recentArticles.map((article) => (
              <div key={article.id} className="w-72 shrink-0 snap-start sm:w-auto sm:shrink">
                <ArticleCard article={article} />
              </div>
            ))}
          </div>
        )}
      </section>
      </div>
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
