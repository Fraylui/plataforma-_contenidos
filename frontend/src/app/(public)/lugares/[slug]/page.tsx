import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import {
  getCategoryById,
  getGeographyUnitById,
  getPlatformSettings,
  getPublishedPlaceBySlug,
  listPublishedArticles,
  listPublishedPlaces,
} from "@/lib/api/client";
import { NotFoundError } from "@/lib/api/client";
import { YouTubeEmbed } from "@/components/article/youtube-embed";
import { ArticleCard } from "@/components/article/article-card";
import { PlaceCard } from "@/components/place/place-card";
import { LikeShareBar } from "@/components/content/like-share-bar";
import { AdBlock } from "@/components/legal/ad-block";
import { imageUrl } from "@/lib/image-url";
import { serverImageUrl } from "@/lib/server-image-url";
import { SITE_URL } from "@/lib/site-url";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";
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

function breadcrumbJsonLd(place: Place, category: Category | null) {
  const items = [
    { name: "Inicio", url: SITE_URL },
    { name: "Lugares", url: `${SITE_URL}/lugares` },
    ...(category ? [{ name: category.name, url: `${SITE_URL}/categorias/${category.slug}` }] : []),
    { name: place.name, url: `${SITE_URL}/lugares/${place.slug}` },
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

  const [heroImageId, ...galleryImageIds] = place.imageIds;
  const hasSidebar = morePlaces.length > 0 || moreArticles.length > 0;
  const mapsUrl =
    place.latitude != null && place.longitude != null
      ? `https://www.google.com/maps?q=${place.latitude},${place.longitude}`
      : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(placeJsonLd(place, category, settings.name)).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(place, category)).replace(/</g, "\\u003c"),
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
                <Link href="/lugares" className="hover:text-accent hover:underline">
                  Lugares
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="max-w-[12rem] truncate text-foreground/80 sm:max-w-[24rem]" aria-current="page">
                {place.name}
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide text-accent uppercase">
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

          <h1 className="mt-4 text-2xl leading-tight font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {place.name}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border pb-6 text-xs text-muted sm:text-sm">
            {geography && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {geography.name}
              </span>
            )}
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-accent hover:underline">
                {place.latitude!.toFixed(4)}, {place.longitude!.toFixed(4)} · Ver en el mapa
              </a>
            )}
          </div>

          {heroImageId && (
            <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl border border-border bg-canvas-strong shadow-lg">
              <SkeletonImage
                src={serverImageUrl(`/api/v1/images/${heroImageId}/file`)}
                alt={place.name}
                className="object-cover"
              />
            </div>
          )}

          {galleryImageIds.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {galleryImageIds.map((id, index) => (
                <div key={id} className="relative aspect-square overflow-hidden rounded-lg border border-border bg-canvas-strong">
                  <SkeletonImage
                    src={serverImageUrl(`/api/v1/images/${id}/file`)}
                    alt={`${place.name} — fotografía ${index + 2}`}
                    className="object-cover"
                    sizes="180px"
                  />
                </div>
              ))}
            </div>
          )}

          {!heroImageId && (
            <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl border border-border bg-canvas-strong shadow-lg">
              <NoImagePlaceholder />
            </div>
          )}

          {place.youtubeVideoId && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-border shadow-lg">
              <YouTubeEmbed videoId={place.youtubeVideoId} title={place.name} />
            </div>
          )}

          {place.excerpt && (
            <p className="mt-8 text-lg leading-relaxed font-medium text-foreground/90">{place.excerpt}</p>
          )}

          {/* place.body es texto plano (a diferencia de Article, sin editor Tiptap todavía),
              así que se preserva el salto de línea en vez de renderizar HTML. */}
          <div className="mt-6 max-w-none text-base leading-relaxed whitespace-pre-line text-foreground">
            {place.body}
          </div>

          <div className="mt-10">
            <AdBlock position="article" />
          </div>

          <LikeShareBar contentType="places" slug={place.slug} initialLikeCount={place.likeCount} title={place.name} />

          {place.relatedArticles.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold text-foreground">Publicaciones relacionadas</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {place.relatedArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </section>
          )}
        </article>

        {hasSidebar && (
          <aside className="mt-14 lg:col-span-4 lg:mt-0">
            <div className="space-y-10 lg:sticky lg:top-24">
              {morePlaces.length > 0 && (
                <section aria-label="Más lugares">
                  <h2 className="text-lg font-semibold text-foreground">
                    Más lugares en {category!.name}
                  </h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    {morePlaces.map((related) => (
                      <PlaceCard key={related.id} place={related} />
                    ))}
                  </div>
                </section>
              )}

              {moreArticles.length > 0 && (
                <section aria-label="Publicaciones de esta categoría">
                  <h2 className="text-lg font-semibold text-foreground">
                    Publicaciones sobre {category!.name}
                  </h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    {moreArticles.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
