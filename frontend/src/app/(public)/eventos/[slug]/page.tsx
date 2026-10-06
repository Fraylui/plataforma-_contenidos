import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarBlank, CalendarPlus, DownloadSimple, MapPin } from "@phosphor-icons/react/dist/ssr";
import {
  getCategoryById,
  getPlatformSettings,
  getPublishedEventBySlug,
  getPublishedPlaceById,
  getRelatedWithFallback,
} from "@/lib/api/client";
import { NotFoundError } from "@/lib/api/client";
import { formatEventDateTime, isEventFinished } from "@/lib/content-labels";
import { LikeShareBar, POST_ACTION_PILL } from "@/components/content/like-share-bar";
import { PostView } from "@/components/post/post-view";
import { PostDetailMedia } from "@/components/post/post-detail-media";
import { PostFacts, type PostFact } from "@/components/post/post-facts";
import { calendarLinks } from "@/components/post/calendar-link";
import { KIND_LABEL } from "@/lib/content-kind";
import { fromFeedItem } from "@/lib/home-items";
import { AdBlock } from "@/components/legal/ad-block";
import { SITE_URL } from "@/lib/site-url";
import type { Category, Event } from "@/lib/api/types";
import { VideoJsonLd } from "@/components/seo/video-json-ld";

/** "Más como esto": 3 filas de la cuadrícula de 3. */
const MORE_SIZE = 9;

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

// Ninguna ruta se genera en el build (el contenido vive en la base, no en
// el repo): cada una se genera la primera vez que alguien la visita y
// queda en caché (ISR) hasta que vence su revalidación o el panel la
// invalida (lib/cache-tags.ts). Sin esto Next la trataba como dinámica y
// la volvía a generar en cada visita (ver docs de generateStaticParams).
export function generateStaticParams() {
  return [];
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

function breadcrumbJsonLd(event: Event, category: Category | null) {
  const items = [
    { name: "Inicio", url: SITE_URL },
    { name: "Eventos", url: `${SITE_URL}/eventos` },
    ...(category ? [{ name: category.name, url: `${SITE_URL}/categorias/${category.slug}` }] : []),
    { name: event.title, url: `${SITE_URL}/eventos/${event.slug}` },
  ];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export default async function EventPage(props: PageProps<"/eventos/[slug]">) {
  const { slug } = await props.params;
  const event = await loadEvent(slug);

  const [category, settings, place, relatedPage] = await Promise.all([
    getCategoryById(event.categoryId).catch(() => null),
    getPlatformSettings(),
    event.placeId ? getPublishedPlaceById(event.placeId).catch(() => null) : Promise.resolve(null),
    getRelatedWithFallback({ excludeType: "EVENT", excludeId: event.id, categoryId: event.categoryId, size: MORE_SIZE }),
  ]);

  const venue = place ? { name: place.name, slug: place.slug } : null;
  const finished = isEventFinished(event);
  const when = `${formatEventDateTime(event.startsAt)}${event.endsAt ? ` — ${formatEventDateTime(event.endsAt)}` : ""}`;
  const where = venue?.name ?? event.venueName;
  const calendar = calendarLinks({
    title: event.title,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    url: `${SITE_URL}/eventos/${event.slug}`,
    location: where,
  });
  const facts: PostFact[] = [
    { icon: CalendarBlank, label: finished ? "Finalizó" : "Cuándo", value: when },
    ...(venue
      ? [{ icon: MapPin, label: "Dónde", value: venue.name, href: `/lugares/${venue.slug}` }]
      : event.venueName
        ? [{ icon: MapPin, label: "Dónde", value: event.venueName }]
        : []),
  ];

  return (
    <>
      <VideoJsonLd
        videos={event.videos}
        fallbackTitle={event.title}
        description={event.metaDescription || event.excerpt}
        uploadDate={event.publishedAt}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(eventJsonLd(event, category, settings.name, venue)).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(event, category)).replace(/</g, "\\u003c"),
        }}
      />

      <PostView
        variant="visual"
        brand={{ name: settings.name, logoUrl: settings.logoUrl ?? null }}
        typeLabel={KIND_LABEL.evento}
        categoryName={category?.name}
        // La fecha del evento va en los datos ("Cuándo"), no repetida en el encabezado.
        time={null}
        title={event.title}
        media={<PostDetailMedia images={event.images} videos={event.videos} title={event.title} />}
        excerpt={event.excerpt}
        facts={<PostFacts facts={facts} />}
        body={
          // event.body es HTML ya sanitizado en el backend (HtmlSanitizer, whitelist
          // de tags) antes de persistirse — nunca se renderiza HTML sin pasar por ahí.
          <div className="prose prose-theme max-w-none prose-headings:font-bold prose-a:text-accent" dangerouslySetInnerHTML={{ __html: event.body }} />
        }
        actions={
          <LikeShareBar contentType="events" slug={event.slug} initialLikeCount={event.likeCount} title={event.title}>
            {!finished && (
              <>
                <a href={calendar.google} target="_blank" rel="noopener noreferrer" className={POST_ACTION_PILL}>
                  <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                  Google Calendar
                </a>
                <a href={calendar.ics} download={`${event.slug}.ics`} className={POST_ACTION_PILL}>
                  <DownloadSimple className="h-4 w-4" aria-hidden="true" />
                  Otro calendario
                </a>
              </>
            )}
          </LikeShareBar>
        }
        ad={<AdBlock position="article" section="EVENT" categoryId={event.categoryId} layout="band" count={2} />}
        more={[...relatedPage.related, ...relatedPage.more].map(fromFeedItem)}
      />
    </>
  );
}
