import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getPlatformSettings,
  listActiveCategories,
  listPublishedArticles,
  listPublishedEvents,
  listPublishedGalleries,
  listPublishedPlaces,
  listPublishedReviews,
} from "@/lib/api/client";
import { fromArticle, fromEvent, fromGallery, fromPlace, fromReview, sortNewestFirst, type HomeItem } from "@/lib/home-items";
import { HeroRotator } from "@/components/home/hero-rotator";
import { ContentCard, FeaturedContentCard } from "@/components/home/content-card";
import { CategorySpotlight, type SpotlightCategory } from "@/components/home/category-spotlight";
import { EventRowCard } from "@/components/home/event-row-card";

// Cuántos traer de cada tipo: alcanza para el hero (4), "Lo nuevo" (6) y
// la categoría en foco (hasta 3 por categoría) sin pedir listados enormes.
const ARTICLES_SIZE = 12;
const PLACES_SIZE = 8;
const GALLERIES_SIZE = 6;
const REVIEWS_SIZE = 6;
const UPCOMING_EVENTS_SIZE = 3;

const HERO_SIZE = 4;
// 1 destacada (2 columnas) + 2 en la primera fila, 4 en la segunda: rejilla de 4 columnas en escritorio.
const NEW_GRID_SIZE = 7;
const SPOTLIGHT_CATEGORIES_MAX = 6;

/**
 * Hero: un contenido por tipo (el más nuevo de cada uno, priorizando los
 * que tienen imagen) para que la rotación muestre la variedad de la
 * plataforma, no 4 publicaciones seguidas.
 */
function pickHero(byKind: HomeItem[][]): HomeItem[] {
  const withImage = byKind.map((list) => list.find((i) => i.imageUrl)).filter((i): i is HomeItem => Boolean(i));
  const picked = withImage.slice(0, HERO_SIZE);
  if (picked.length < HERO_SIZE) {
    for (const list of byKind) {
      for (const item of list) {
        if (picked.length >= HERO_SIZE) break;
        if (!picked.some((p) => p.id === item.id)) picked.push(item);
      }
    }
  }
  // Lo más reciente siempre primero: es el slide inicial y el que ve quien
  // no espera la rotación.
  return sortNewestFirst(picked);
}

export default async function Home() {
  const [articles, places, galleries, reviews, events, categories, settings] = await Promise.all([
    listPublishedArticles({ size: ARTICLES_SIZE }),
    listPublishedPlaces({ size: PLACES_SIZE }),
    listPublishedGalleries({ size: GALLERIES_SIZE }),
    listPublishedReviews({ size: REVIEWS_SIZE }),
    listPublishedEvents({ when: "upcoming", size: UPCOMING_EVENTS_SIZE }),
    listActiveCategories(),
    getPlatformSettings(),
  ]);

  const categoryNames: Record<string, string> = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const articleItems = articles.items.map(fromArticle);
  const placeItems = places.items.map(fromPlace);
  const galleryItems = galleries.items.map(fromGallery);
  const reviewItems = reviews.items.map(fromReview);
  const eventItems = events.items.map(fromEvent);

  const hero = pickHero([articleItems, placeItems, galleryItems, eventItems, reviewItems]);
  const heroIds = new Set(hero.map((i) => i.id));

  // "Lo nuevo": todo lo publicado (sin eventos, que se ordenan por agenda y
  // tienen su propia sección), más nuevo primero, sin repetir el hero.
  const newest = sortNewestFirst([...articleItems, ...placeItems, ...galleryItems, ...reviewItems])
    .filter((i) => !heroIds.has(i.id))
    .slice(0, NEW_GRID_SIZE);
  const [newestFeatured, ...newestRest] = newest;

  // Categoría en foco: solo categorías con contenido, ordenadas por sortOrder.
  const allItems = [...articleItems, ...placeItems, ...galleryItems, ...reviewItems, ...eventItems];
  const spotlight: SpotlightCategory[] = categories
    .filter((c) => c.parentId === null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug, items: sortNewestFirst(allItems.filter((i) => i.categoryId === c.id)) }))
    .filter((c) => c.items.length > 0)
    .slice(0, SPOTLIGHT_CATEGORIES_MAX);

  const isEmpty = hero.length === 0;

  return (
    <div className="flex flex-col">
      {/* Único <h1> de la página, fuera de pantalla: el header ya muestra la marca. */}
      <h1 className="sr-only">{settings.name}</h1>

      {isEmpty ? (
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-dashed border-canvas-border px-6 py-16 text-center">
            <p className="text-sm text-muted">Todavía no hay contenido publicado. Vuelve pronto.</p>
          </div>
        </div>
      ) : (
        <HeroRotator items={hero} categoryNames={categoryNames} />
      )}

      {newest.length > 0 && (
        <section aria-labelledby="lo-nuevo" className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="lo-nuevo" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                <span className="h-2 w-2 rounded-full bg-red-600" aria-hidden="true" />
                Lo nuevo en {settings.shortName || settings.name}
              </h2>
              <p className="hidden text-sm text-muted sm:block">
                Publicaciones, lugares, galerías y reseñas, mezclados y ordenados por fecha.
              </p>
            </div>
            <Link
              href="/publicaciones"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent bg-surface px-3.5 py-2 text-[13px] font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Ver todo
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4 lg:grid-cols-4">
            <FeaturedContentCard
              item={newestFeatured}
              categoryName={categoryNames[newestFeatured.categoryId]}
              cta={newestFeatured.kind === "galeria" ? "Ver galería" : "Leer"}
            />
            {newestRest.map((item) => (
              <ContentCard key={item.id} item={item} categoryName={categoryNames[item.categoryId]} />
            ))}
          </div>
        </section>
      )}

      {spotlight.length > 0 && (
        <div className="mt-8 sm:mt-12">
          <CategorySpotlight categories={spotlight} />
        </div>
      )}

      {events.items.length > 0 && (
        <section aria-labelledby="proximos-eventos" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <h2 id="proximos-eventos" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Próximos eventos
            </h2>
            <Link
              href="/eventos"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent bg-surface px-3.5 py-2 text-[13px] font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Agenda completa
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {events.items.map((event) => (
              <EventRowCard key={event.id} event={event} categoryName={categoryNames[event.categoryId]} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
