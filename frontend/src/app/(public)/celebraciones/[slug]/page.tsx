import type { Metadata } from "next";
import { PROSE } from "@/lib/prose";
import { notFound } from "next/navigation";
import { CalendarBlank, CalendarPlus, DownloadSimple, GlobeHemisphereWest, MapPin } from "@phosphor-icons/react/dist/ssr";
import {
  getCategoryById,
  getPlatformSettings,
  getPublishedCelebrationBySlug,
  getPublishedPlaceById,
  getRelatedWithFallback,
} from "@/lib/api/client";
import { NotFoundError } from "@/lib/api/client";
import { formatEventDateTime, isCelebrationFinished } from "@/lib/content-labels";
import { formatCelebrationDate } from "@/lib/celebration-date";
import { celebrationPlace } from "@/lib/countries";
import { LikeShareBar, POST_ACTION_PILL } from "@/components/content/like-share-bar";
import { ViewBeacon } from "@/components/content/view-beacon";
import { PostView } from "@/components/post/post-view";
import { PostDetailMedia } from "@/components/post/post-detail-media";
import { PostFacts, type PostFact } from "@/components/post/post-facts";
import { calendarLinks } from "@/components/post/calendar-link";
import { KIND_LABEL } from "@/lib/content-kind";
import { fromFeedItem } from "@/lib/home-items";
import { AdBlock } from "@/components/legal/ad-block";
import { SITE_URL } from "@/lib/site-url";
import type { Category, Celebration } from "@/lib/api/types";
import { robotsWithLargePreview, shareImageUrl } from "@/lib/share-image";
import { VideoJsonLd } from "@/components/seo/video-json-ld";

/** "Más como esto": 3 filas de la cuadrícula de 3. */
const MORE_SIZE = 9;

async function loadCelebration(slug: string) {
  try {
    return await getPublishedCelebrationBySlug(slug);
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

export async function generateMetadata(props: PageProps<"/celebraciones/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  let celebration;
  try {
    celebration = await getPublishedCelebrationBySlug(slug);
  } catch {
    return {};
  }
  const settings = await getPlatformSettings();

  const title = celebration.seoTitle || celebration.title;
  const description = celebration.metaDescription || celebration.excerpt || undefined;

  return {
    title,
    description,
    alternates: { canonical: celebration.canonicalUrl || `/celebraciones/${slug}` },
    robots: robotsWithLargePreview(celebration.robots),
    openGraph: {
      title,
      description,
      type: "website",
      images: shareImageUrl(celebration) ?? undefined,
      siteName: settings.name,
    },
  };
}

function celebrationJsonLd(
  celebration: Celebration,
  category: Category | null,
  siteName: string,
  venue: { name: string; slug: string } | null,
) {
  const venueUrl = venue ? `${SITE_URL}/lugares/${venue.slug}` : undefined;
  const url = celebration.canonicalUrl || `${SITE_URL}/celebraciones/${celebration.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: celebration.title,
    description: celebration.metaDescription || celebration.excerpt || undefined,
    startDate: celebration.startsAt,
    endDate: celebration.endsAt || undefined,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    image: shareImageUrl(celebration) ?? undefined,
    location: venue
      ? { "@type": "Place", name: venue.name, url: venueUrl }
      : { "@type": "VirtualLocation", url },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(category ? { keywords: category.name } : {}),
    organizer: { "@type": "Organization", name: siteName },
  };
}

function breadcrumbJsonLd(celebration: Celebration, category: Category | null) {
  const items = [
    { name: "Inicio", url: SITE_URL },
    { name: "Celebraciones", url: `${SITE_URL}/celebraciones` },
    ...(category ? [{ name: category.name, url: `${SITE_URL}/categorias/${category.slug}` }] : []),
    { name: celebration.title, url: `${SITE_URL}/celebraciones/${celebration.slug}` },
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

export default async function CelebrationPage(props: PageProps<"/celebraciones/[slug]">) {
  const { slug } = await props.params;
  const celebration = await loadCelebration(slug);

  const [category, settings, place, relatedPage] = await Promise.all([
    getCategoryById(celebration.categoryId).catch(() => null),
    getPlatformSettings(),
    celebration.placeId ? getPublishedPlaceById(celebration.placeId).catch(() => null) : Promise.resolve(null),
    getRelatedWithFallback({ excludeType: "CELEBRATION", excludeId: celebration.id, categoryId: celebration.categoryId, size: MORE_SIZE }),
  ]);

  const venue = place ? { name: place.name, slug: place.slug } : null;
  const finished = isCelebrationFinished(celebration);
  const when = celebration.recursYearly || celebration.allDay
    ? formatCelebrationDate({ at: celebration.nextOccurrenceAt, allDay: celebration.allDay, recursYearly: celebration.recursYearly, sinceYear: celebration.sinceYear })
    : `${formatEventDateTime(celebration.startsAt)}${celebration.endsAt ? ` — ${formatEventDateTime(celebration.endsAt)}` : ""}`;
  const where = venue?.name ?? celebration.venueName;
  const calendar = calendarLinks({
    title: celebration.title,
    startsAt: celebration.nextOccurrenceAt,
    endsAt: celebration.recursYearly ? null : celebration.endsAt,
    allDay: celebration.allDay,
    recursYearly: celebration.recursYearly,
    url: `${SITE_URL}/celebraciones/${celebration.slug}`,
    location: where,
  });
  const facts: PostFact[] = [
    { icon: CalendarBlank, label: celebration.recursYearly ? "Cada año" : finished ? "Fue" : "Cuándo", value: when },
    { icon: GlobeHemisphereWest, label: "Se celebra en", value: celebrationPlace(celebration.scopeCountry, celebration.scopeRegion) },
    ...(venue
      ? [{ icon: MapPin, label: "Dónde", value: venue.name, href: `/lugares/${venue.slug}` }]
      : celebration.venueName
        ? [{ icon: MapPin, label: "Dónde", value: celebration.venueName }]
        : []),
  ];

  return (
    <>
      <VideoJsonLd
        videos={celebration.videos}
        fallbackTitle={celebration.title}
        description={celebration.metaDescription || celebration.excerpt}
        uploadDate={celebration.publishedAt}
      />
      {/* Celebration de schema.org solo para fechas únicas: Google pide no marcar como evento las conmemoraciones que se repiten. */}
      {!celebration.recursYearly && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(celebrationJsonLd(celebration, category, settings.name, venue)).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(celebration, category)).replace(/</g, "\\u003c"),
        }}
      />

      <PostView
        variant="visual"
        brand={{ name: settings.name, logoUrl: settings.logoUrl ?? null }}
        typeLabel={KIND_LABEL.celebracion}
        categoryName={category?.name}
        // La fecha va en los datos ("Cuándo" / "Cada año"), no repetida en el encabezado.
        time={null}
        title={celebration.title}
        media={<PostDetailMedia images={celebration.images} videos={celebration.videos} title={celebration.title} />}
        excerpt={celebration.excerpt}
        facts={<PostFacts facts={facts} />}
        body={
          // celebration.body es HTML ya sanitizado en el backend (HtmlSanitizer, whitelist
          // de tags) antes de persistirse — nunca se renderiza HTML sin pasar por ahí.
          <div className={PROSE} dangerouslySetInnerHTML={{ __html: celebration.body }} />
        }
        actions={
          <>
            <ViewBeacon type="CELEBRATION" id={celebration.id} />
            <LikeShareBar contentType="celebrations" slug={celebration.slug} initialLikeCount={celebration.likeCount} title={celebration.title}>
              {!finished && (
                <>
                  <a href={calendar.google} target="_blank" rel="noopener noreferrer" className={POST_ACTION_PILL}>
                    <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                    Google Calendar
                  </a>
                  <a href={calendar.ics} download={`${celebration.slug}.ics`} className={POST_ACTION_PILL}>
                    <DownloadSimple className="h-4 w-4" aria-hidden="true" />
                    Otro calendario
                  </a>
              </>
            )}
          </LikeShareBar>
          </>
        }
        ad={<AdBlock position="article" section="CELEBRATION" categoryId={celebration.categoryId} layout="band" count={2} />}
        more={[...relatedPage.related, ...relatedPage.more].map(fromFeedItem)}
      />
    </>
  );
}
