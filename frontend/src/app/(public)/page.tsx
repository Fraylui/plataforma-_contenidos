import Link from "next/link";
import type { ReactNode } from "react";
import { getPlatformSettings, listPublishedArticles, listPublishedEvents, listPublishedPlaces } from "@/lib/api/client";
import { ArticleCard } from "@/components/article/article-card";
import { PlaceCard } from "@/components/place/place-card";
import { EventCard } from "@/components/event/event-card";
import { articleTypeLabel } from "@/lib/content-labels";
import { serverImageUrl } from "@/lib/server-image-url";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";
import { SkeletonImage } from "@/components/ui/skeleton-image";

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
  // Las 2 siguientes al destacado van de secundarias junto al hero (col-span-5);
  // el resto sigue abajo en "Publicaciones recientes" — sin duplicar.
  const secondaryArticles = poolRest.slice(0, 2);
  const recentArticles = [...poolRest.slice(2), ...overflow];

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 lg:px-8">
      {/* h1 fuera de pantalla: el header ya muestra logo/nombre visualmente,
          duplicarlo acá como bloque oscuro de marca (versión anterior) era
          la redundancia que se reportó — pero la página igual necesita un
          único <h1> real para SEO/accesibilidad. */}
      <h1 className="sr-only">{settings.name}</h1>

      {featuredArticle && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Link
            href={`/publicaciones/${featuredArticle.slug}`}
            className="group relative aspect-[16/10] overflow-hidden rounded-2xl border border-border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl lg:col-span-7"
          >
            {featuredArticle.featuredImageId ? (
              <SkeletonImage
                src={serverImageUrl(`/api/v1/images/${featuredArticle.featuredImageId}/file`)}
                alt={featuredArticle.title}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(min-width: 1024px) 58vw, 100vw"
              />
            ) : (
              <NoImagePlaceholder />
            )}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(9,9,11,0.92) 0%, rgba(9,9,11,0.45) 45%, transparent 75%)" }}
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 sm:p-8">
              <span className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-semibold tracking-wide text-accent-foreground uppercase">
                {articleTypeLabel(featuredArticle.articleType)}
              </span>
              <h2 className="text-xl font-bold leading-tight tracking-tight text-white sm:text-2xl lg:text-3xl">
                {featuredArticle.title}
              </h2>
              {featuredArticle.excerpt && (
                <p className="line-clamp-2 text-sm leading-relaxed text-white/80 sm:text-base">{featuredArticle.excerpt}</p>
              )}
            </div>
          </Link>

          {secondaryArticles.length > 0 && (
            <div className="flex flex-col gap-4 lg:col-span-5">
              {secondaryArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/publicaciones/${article.slug}`}
                  className="group flex gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl sm:w-28">
                    {article.featuredImageId ? (
                      <SkeletonImage
                        src={serverImageUrl(`/api/v1/images/${article.featuredImageId}/file`)}
                        alt={article.title}
                        className="object-cover"
                        sizes="112px"
                      />
                    ) : (
                      <NoImagePlaceholder />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-center gap-1">
                    <span className="text-xs font-semibold tracking-wide text-accent uppercase">
                      {articleTypeLabel(article.articleType)}
                    </span>
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-accent sm:text-base">
                      {article.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {placesPage.items.length > 0 && (
        <section aria-label="Lugares destacados">
          <SectionHeader title="Lugares destacados" href="/lugares" />
          <HorizontalOnMobile>
            {placesPage.items.map((place) => (
              <CarouselItem key={place.id}>
                <PlaceCard place={place} />
              </CarouselItem>
            ))}
          </HorizontalOnMobile>
        </section>
      )}

      {eventsPage.items.length > 0 && (
        <section aria-label="Próximos eventos">
          <SectionHeader title="Próximos eventos" href="/eventos" />
          <HorizontalOnMobile>
            {eventsPage.items.map((event) => (
              <CarouselItem key={event.id}>
                <EventCard event={event} />
              </CarouselItem>
            ))}
          </HorizontalOnMobile>
        </section>
      )}

      <section aria-label="Publicaciones recientes">
        <SectionHeader title="Publicaciones recientes" href={articlesPage.items.length > 0 ? "/publicaciones" : undefined} />
        {articlesPage.items.length === 0 ? (
          <EmptyState />
        ) : recentArticles.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Todavía no hay más artículos publicados.</p>
        ) : (
          <HorizontalOnMobile>
            {recentArticles.map((article) => (
              <CarouselItem key={article.id}>
                <ArticleCard article={article} />
              </CarouselItem>
            ))}
          </HorizontalOnMobile>
        )}
      </section>
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      {href && (
        <Link
          href={href}
          className="rounded-full border border-accent px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Ver todos
        </Link>
      )}
    </div>
  );
}

/**
 * Fila de destacados: scroll horizontal con snap en mobile (no hay espacio
 * para una grilla de verdad en una pantalla angosta), grid fijo de verdad
 * en sm+ — mismo criterio de columnas 1/2/3/4 que el resto del sitio, así
 * no depende de auto-fit (que estiraba la última tarjeta sola en la fila).
 */
function HorizontalOnMobile({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  );
}

function CarouselItem({ children }: { children: ReactNode }) {
  return <div className="w-72 shrink-0 snap-start sm:w-auto sm:shrink">{children}</div>;
}

function EmptyState() {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      <p className="text-sm text-muted">
        Todavía no hay artículos publicados. Vuelve pronto.
      </p>
    </div>
  );
}
