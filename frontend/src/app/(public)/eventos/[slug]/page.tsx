import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import {
  getCategoryById,
  getGeographyUnitById,
  getPlatformSettings,
  getPublishedEventBySlug,
  getPublishedPlaceById,
  getRelatedWithFallback,
} from "@/lib/api/client";
import { NotFoundError } from "@/lib/api/client";
import { formatEventDateTime, isEventFinished } from "@/lib/content-labels";
import { YouTubeEmbed } from "@/components/article/youtube-embed";
import { LikeShareBar } from "@/components/content/like-share-bar";
import { RelatedFeed } from "@/components/content/related-feed";
import { ContentImageDisplay } from "@/components/content/content-image-display";
import { AdBlock } from "@/components/legal/ad-block";
import { SITE_URL } from "@/lib/site-url";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";
import type { Category, Event } from "@/lib/api/types";

const RELATED_SIZE = 6;

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

  const { items: related, isFallback: relatedIsFallback } = await getRelatedWithFallback({
    excludeType: "EVENT",
    excludeId: event.id,
    categoryId: event.categoryId,
    geographyId: event.geographyId,
    size: RELATED_SIZE,
  });
  const relatedTitle = relatedIsFallback ? "Quizás te interese" : `Relacionado con ${category?.name ?? "esto"}`;

  const venue = place ? { name: place.name, slug: place.slug } : null;
  const finished = isEventFinished(event);
  const [heroImage, ...galleryImages] = event.images;
  const hasSidebar = related.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(eventJsonLd(event, category, settings.name, venue)).replace(/</g, "\\u003c"),
        }}
      />

      <div className={hasSidebar ? "lg:grid lg:grid-cols-12 lg:gap-12" : undefined}>
        <article className={`mx-auto max-w-3xl ${hasSidebar ? "lg:col-span-8 lg:mx-0 lg:max-w-none" : ""}`}>
          <nav aria-label="Breadcrumb" className="mb-4 flex max-w-[280px] items-center gap-2 truncate text-xs text-muted sm:max-w-none">
            <ol className="flex flex-wrap items-center gap-1.5 truncate">
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
              <li className="max-w-[12rem] truncate text-foreground/80 sm:max-w-[24rem]" aria-current="page">
                {event.title}
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide text-accent uppercase">
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
                <span className="rounded-full bg-canvas-strong px-2 py-0.5 text-muted normal-case">Finalizado</span>
              </>
            )}
          </div>

          <h1 className="mt-4 text-2xl leading-tight font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {event.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border pb-6 text-xs text-muted sm:text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold text-accent">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              {formatEventDateTime(event.startsAt)}
              {event.endsAt ? ` — ${formatEventDateTime(event.endsAt)}` : ""}
            </span>
            {venue ? (
              <Link href={`/lugares/${venue.slug}`} className="inline-flex items-center gap-1.5 hover:text-accent hover:underline">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {venue.name}
              </Link>
            ) : event.venueName ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {event.venueName}
              </span>
            ) : null}
            {geography && <span>{geography.name}</span>}
          </div>

          {heroImage ? (
            <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl border border-border bg-canvas-strong shadow-lg">
              <ContentImageDisplay image={heroImage} alt={event.title} className="object-cover" />
            </div>
          ) : (
            <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl border border-border bg-canvas-strong shadow-lg">
              <NoImagePlaceholder />
            </div>
          )}

          {galleryImages.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {galleryImages.map((img, index) => (
                <div
                  key={img.imageId ?? img.externalUrl}
                  className="relative aspect-square overflow-hidden rounded-lg border border-border bg-canvas-strong"
                >
                  <ContentImageDisplay
                    image={img}
                    alt={`${event.title} — fotografía ${index + 2}`}
                    className="object-cover"
                    sizes="180px"
                  />
                </div>
              ))}
            </div>
          )}

          {event.youtubeVideoIds.map((videoId) => (
            <div key={videoId} className="mt-8 overflow-hidden rounded-2xl border border-border shadow-lg">
              <YouTubeEmbed videoId={videoId} title={event.title} />
            </div>
          ))}

          {event.excerpt && (
            <p className="mt-8 text-lg leading-relaxed font-medium text-foreground/90">{event.excerpt}</p>
          )}

          <div className="mt-6 max-w-none text-base leading-relaxed whitespace-pre-line text-foreground">
            {event.body}
          </div>

          <div className="mt-10">
            <AdBlock position="article" />
          </div>

          <LikeShareBar contentType="events" slug={event.slug} initialLikeCount={event.likeCount} title={event.title} />
        </article>

        {hasSidebar && (
          <aside className="mt-14 lg:col-span-4 lg:mt-0">
            <div className="lg:sticky lg:top-24">
              <RelatedFeed items={related} title={relatedTitle} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
