import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategoryById,
  getGeographyUnitById,
  getPlatformSettings,
  getPublishedEventBySlug,
  getPublishedPlaceById,
  listPublishedArticles,
  listPublishedEvents,
  listPublishedPlaces,
} from "@/lib/api/client";
import { NotFoundError } from "@/lib/api/client";
import { formatEventDateTime, isEventFinished } from "@/lib/content-labels";
import { YouTubeEmbed } from "@/components/article/youtube-embed";
import { ArticleCard } from "@/components/article/article-card";
import { PlaceCard } from "@/components/place/place-card";
import { EventCard } from "@/components/event/event-card";
import { imageUrl } from "@/lib/image-url";
import { SITE_URL } from "@/lib/site-url";
import type { Category, Event } from "@/lib/api/types";

const RELATED_SIZE = 4;

async function loadEvent(slug: string) {
  try {
    return await getPublishedEventBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }
}

export async function generateMetadata(props: PageProps<"/eventos/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  let event;
  try {
    event = await getPublishedEventBySlug(slug);
  } catch {
    return {};
  }
  const settings = await getPlatformSettings();

  const title = event.seoTitle || event.title;
  const description = event.metaDescription || event.excerpt || undefined;

  return {
    title,
    description,
    alternates: { canonical: event.canonicalUrl || `/eventos/${slug}` },
    robots: event.robots,
    openGraph: {
      title,
      description,
      type: "website",
      images: event.ogImageUrl ? [event.ogImageUrl] : undefined,
      siteName: settings.name,
    },
  };
}

function eventJsonLd(
  event: Event,
  category: Category | null,
  siteName: string,
  venue: { name: string; slug: string } | null,
) {
  const venueUrl = venue ? `${SITE_URL}/lugares/${venue.slug}` : undefined;
  const url = event.canonicalUrl || `${SITE_URL}/eventos/${event.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.metaDescription || event.excerpt || undefined,
    startDate: event.startsAt,
    endDate: event.endsAt || undefined,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    image: event.ogImageUrl ? [event.ogImageUrl] : undefined,
    location: venue
      ? { "@type": "Place", name: venue.name, url: venueUrl }
      : { "@type": "VirtualLocation", url },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(category ? { keywords: category.name } : {}),
    organizer: { "@type": "Organization", name: siteName },
  };
}

export default async function EventPage(props: PageProps<"/eventos/[slug]">) {
  const { slug } = await props.params;
  const event = await loadEvent(slug);

  const [category, geography, settings, place] = await Promise.all([
    getCategoryById(event.categoryId).catch(() => null),
    event.geographyId ? getGeographyUnitById(event.geographyId).catch(() => null) : Promise.resolve(null),
    getPlatformSettings(),
    event.placeId ? getPublishedPlaceById(event.placeId).catch(() => null) : Promise.resolve(null),
  ]);

  const [relatedPlacesResult, relatedArticlesResult, relatedEventsResult] = category
    ? await Promise.all([
        listPublishedPlaces({ categoryId: category.id, size: RELATED_SIZE }),
        listPublishedArticles({ categoryId: category.id, size: RELATED_SIZE }),
        listPublishedEvents({ categoryId: category.id, when: "upcoming", size: RELATED_SIZE + 1 }),
      ])
    : [null, null, null];
  const relatedPlaces = relatedPlacesResult?.items ?? [];
  const relatedArticles = relatedArticlesResult?.items ?? [];
  const relatedEvents = (relatedEventsResult?.items ?? []).filter((e) => e.id !== event.id).slice(0, RELATED_SIZE);

  const venue = place ? { name: place.name, slug: place.slug } : null;
  const finished = isEventFinished(event);

  return (
    <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(eventJsonLd(event, category, settings.name, venue)).replace(/</g, "\\u003c"),
        }}
      />

      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-accent hover:underline">
              Inicio
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/eventos" className="hover:text-accent hover:underline">
              Eventos
            </Link>
          </li>
          {category && (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={`/categorias/${category.slug}`} className="hover:text-accent hover:underline">
                  {category.name}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden="true">/</li>
          <li className="max-w-[24rem] truncate text-foreground/80" aria-current="page">
            {event.title}
          </li>
        </ol>
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide text-accent uppercase">
        <span>Evento</span>
        {category && (
          <>
            <span aria-hidden="true" className="text-border">
              ·
            </span>
            <span>{category.name}</span>
          </>
        )}
        {finished && (
          <>
            <span aria-hidden="true" className="text-border">
              ·
            </span>
            <span className="rounded-full bg-surface px-2 py-0.5 text-muted normal-case">Finalizado</span>
          </>
        )}
      </div>

      <h1 className="mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
        {event.title}
      </h1>

      <div className="mt-4 space-y-1 text-sm text-foreground">
        <p className="font-medium">
          {formatEventDateTime(event.startsAt)}
          {event.endsAt ? ` — ${formatEventDateTime(event.endsAt)}` : ""}
        </p>
        {venue ? (
          <p>
            <Link href={`/lugares/${venue.slug}`} className="text-muted hover:text-accent hover:underline">
              {venue.name}
            </Link>
          </p>
        ) : event.venueName ? (
          <p className="text-muted">{event.venueName}</p>
        ) : null}
        {geography && <p className="text-muted">{geography.name}</p>}
      </div>

      {event.imageIds.length > 0 && (
        // eslint-disable-next-line @next/next/no-img-element -- host propio del backend
        <img
          src={imageUrl(`/api/v1/images/${event.imageIds[0]}/file`)}
          alt={event.title}
          className="mt-8 aspect-video w-full rounded-lg object-cover"
        />
      )}

      {event.youtubeVideoId && (
        <div className="mt-8">
          <YouTubeEmbed videoId={event.youtubeVideoId} title={event.title} />
        </div>
      )}

      {event.excerpt && (
        <p className="mt-8 text-lg leading-relaxed text-foreground/90">{event.excerpt}</p>
      )}

      <div className="mt-6 max-w-[70ch] text-base leading-relaxed whitespace-pre-line text-foreground">
        {event.body}
      </div>

      {(relatedEvents.length > 0 || relatedPlaces.length > 0 || relatedArticles.length > 0) && (
        <div className="mt-14 max-w-none border-t border-border pt-10">
          {relatedEvents.length > 0 && (
            <section aria-label="Otros eventos">
              <h2 className="text-lg font-semibold text-foreground">Otros eventos en {category!.name}</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {relatedEvents.map((related) => (
                  <EventCard key={related.id} event={related} />
                ))}
              </div>
            </section>
          )}

          {relatedPlaces.length > 0 && (
            <section aria-label="Lugares relacionados" className={relatedEvents.length > 0 ? "mt-10" : undefined}>
              <h2 className="text-lg font-semibold text-foreground">Lugares en {category!.name}</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {relatedPlaces.map((related) => (
                  <PlaceCard key={related.id} place={related} />
                ))}
              </div>
            </section>
          )}

          {relatedArticles.length > 0 && (
            <section
              aria-label="Más artículos"
              className={relatedEvents.length > 0 || relatedPlaces.length > 0 ? "mt-10" : undefined}
            >
              <h2 className="text-lg font-semibold text-foreground">Más de {category!.name}</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {relatedArticles.map((related) => (
                  <ArticleCard key={related.id} article={related} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </article>
  );
}
