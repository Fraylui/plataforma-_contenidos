import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategoryById,
  getGeographyUnitById,
  getPlatformSettings,
  getPublishedPlaceBySlug,
  listPublishedArticles,
  listPublishedPlaces,
} from "@/lib/api/client";
import { NotFoundError } from "@/lib/api/client";
import { formatPublishedDate } from "@/lib/content-labels";
import { YouTubeEmbed } from "@/components/article/youtube-embed";
import { ArticleCard } from "@/components/article/article-card";
import { PlaceCard } from "@/components/place/place-card";
import { imageUrl } from "@/lib/image-url";
import { SITE_URL } from "@/lib/site-url";
import type { Category, Place } from "@/lib/api/types";

const RELATED_SIZE = 4;

async function loadPlace(slug: string) {
  try {
    return await getPublishedPlaceBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }
}

export async function generateMetadata(props: PageProps<"/lugares/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  let place;
  try {
    place = await getPublishedPlaceBySlug(slug);
  } catch {
    return {};
  }
  const settings = await getPlatformSettings();

  const title = place.seoTitle || place.name;
  const description = place.metaDescription || place.excerpt || undefined;
  const coverImage = place.imageIds[0] ? imageUrl(`/api/v1/images/${place.imageIds[0]}/file`) : place.ogImageUrl;

  return {
    title,
    description,
    // Cada lugar es canónico de sí mismo por defecto (sección 15), igual que Article.
    alternates: { canonical: place.canonicalUrl || `/lugares/${slug}` },
    robots: place.robots,
    openGraph: {
      title,
      description,
      type: "website",
      images: coverImage ? [coverImage] : undefined,
      siteName: settings.name,
    },
  };
}

function placeJsonLd(place: Place, category: Category | null, siteName: string) {
  const url = place.canonicalUrl || `${SITE_URL}/lugares/${place.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: place.name,
    description: place.metaDescription || place.excerpt || undefined,
    image: place.imageIds.map((id) => imageUrl(`/api/v1/images/${id}/file`)),
    geo:
      place.latitude != null && place.longitude != null
        ? { "@type": "GeoCoordinates", latitude: place.latitude, longitude: place.longitude }
        : undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(category ? { keywords: category.name } : {}),
    publisher: { "@type": "Organization", name: siteName },
  };
}

export default async function PlacePage(props: PageProps<"/lugares/[slug]">) {
  const { slug } = await props.params;
  const place = await loadPlace(slug);

  const [category, geography, settings] = await Promise.all([
    getCategoryById(place.categoryId).catch(() => null),
    place.geographyId ? getGeographyUnitById(place.geographyId).catch(() => null) : Promise.resolve(null),
    getPlatformSettings(),
  ]);

  const [relatedPlacesResult, relatedArticlesResult] = category
    ? await Promise.all([
        listPublishedPlaces({ categoryId: category.id, size: RELATED_SIZE + 1 }),
        listPublishedArticles({ categoryId: category.id, size: RELATED_SIZE }),
      ])
    : [null, null];
  const morePlaces = (relatedPlacesResult?.items ?? [])
    .filter((p) => p.id !== place.id)
    .slice(0, RELATED_SIZE);
  const moreArticles = relatedArticlesResult?.items ?? [];

  return (
    <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(placeJsonLd(place, category, settings.name)).replace(/</g, "\\u003c"),
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
            <Link href="/lugares" className="hover:text-accent hover:underline">
              Lugares
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="max-w-[24rem] truncate text-foreground/80" aria-current="page">
            {place.name}
          </li>
        </ol>
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide text-accent uppercase">
        <span>Lugar</span>
        {category && (
          <>
            <span aria-hidden="true" className="text-border">
              ·
            </span>
            <span>{category.name}</span>
          </>
        )}
      </div>

      <h1 className="mt-3 font-serif text-3xl font-medium leading-tight text-foreground sm:text-4xl">{place.name}</h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        {place.publishedAt && <time dateTime={place.publishedAt}>{formatPublishedDate(place.publishedAt)}</time>}
        {geography && (
          <span className="inline-flex items-center gap-1">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M9.69 18.933c.185.11.404.11.59 0 .014-.008 3.652-2.153 5.652-5.155C16.652 12.05 17 10.55 17 9c0-3.866-3.134-7-7-7S3 5.134 3 9c0 1.55.348 3.05 1.068 4.778 2 3.002 5.638 5.147 5.652 5.155ZM10 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                clipRule="evenodd"
              />
            </svg>
            {geography.name}
          </span>
        )}
        {place.latitude != null && place.longitude != null && (
          <span>
            {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
          </span>
        )}
      </div>

      {place.imageIds.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {place.imageIds.map((id, index) => (
            // eslint-disable-next-line @next/next/no-img-element -- host propio del backend
            <img
              key={id}
              src={imageUrl(`/api/v1/images/${id}/file`)}
              alt={`${place.name} — fotografía ${index + 1}`}
              className="aspect-square w-full rounded-md object-cover"
            />
          ))}
        </div>
      )}

      {place.youtubeVideoId && (
        <div className="mt-8">
          <YouTubeEmbed videoId={place.youtubeVideoId} title={place.name} />
        </div>
      )}

      {place.excerpt && (
        <p className="mt-8 font-serif text-lg leading-relaxed text-foreground/90 italic">{place.excerpt}</p>
      )}

      <div className="mt-6 max-w-[70ch] text-base leading-relaxed whitespace-pre-line text-foreground">
        {place.body}
      </div>

      {place.relatedArticles.length > 0 && (
        <section className="mt-12 border-t border-border pt-8">
          <h2 className="font-serif text-xl font-medium text-foreground">Artículos relacionados</h2>
          <ul className="mt-4 space-y-3">
            {place.relatedArticles.map((article) => (
              <li key={article.id}>
                <Link href={`/articulos/${article.slug}`} className="text-sm font-medium text-foreground hover:text-accent">
                  {article.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(morePlaces.length > 0 || moreArticles.length > 0) && (
        <div className={`max-w-none border-border pt-10 ${place.relatedArticles.length > 0 ? "mt-10" : "mt-14 border-t"}`}>
          {morePlaces.length > 0 && (
            <section aria-label="Más lugares">
              <h2 className="font-serif text-lg font-medium text-foreground">
                Más lugares en {category!.name}
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {morePlaces.map((related) => (
                  <PlaceCard key={related.id} place={related} />
                ))}
              </div>
            </section>
          )}

          {moreArticles.length > 0 && (
            <section aria-label="Artículos de esta categoría" className={morePlaces.length > 0 ? "mt-10" : undefined}>
              <h2 className="font-serif text-lg font-medium text-foreground">
                Artículos sobre {category!.name}
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {moreArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </article>
  );
}
