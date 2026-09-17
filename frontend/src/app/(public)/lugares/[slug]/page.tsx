import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategoryById,
  getPlatformSettings,
  getPublishedPlaceBySlug,
  getRelatedWithFallback,
  listActiveCategories,
} from "@/lib/api/client";
import { NotFoundError } from "@/lib/api/client";
import { LikeShareBar } from "@/components/content/like-share-bar";
import { RelatedFeed } from "@/components/content/related-feed";
import { ContentImageGallery } from "@/components/content/content-image-gallery";
import { ContentVideoGallery } from "@/components/content/content-video-gallery";
import { AdBlock } from "@/components/legal/ad-block";
import { imageUrl } from "@/lib/image-url";
import { SITE_URL } from "@/lib/site-url";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";
import { MapPin } from "lucide-react";
import type { Category, ContentImage, Place } from "@/lib/api/types";

const RELATED_SIZE = 6;

/** Para metadatos (OpenGraph/JSON-LD): siempre una URL alcanzable desde la web pública, nunca desde el servidor de Next. */
function resolveImageUrl(image: ContentImage): string {
  return image.imageId ? imageUrl(`/api/v1/images/${image.imageId}/file`) : (image.externalUrl ?? "");
}

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
  const coverImage = place.images[0] ? resolveImageUrl(place.images[0]) : place.ogImageUrl;

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
    image: place.images.map(resolveImageUrl),
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

  const [category, settings, categories] = await Promise.all([
    getCategoryById(place.categoryId).catch(() => null),
    getPlatformSettings(),
    listActiveCategories(),
  ]);
  const categoryNames: Record<string, string> = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const { items: related, isFallback: relatedIsFallback } = await getRelatedWithFallback({
    excludeType: "PLACE",
    excludeId: place.id,
    categoryId: place.categoryId,
    size: RELATED_SIZE,
  });
  const relatedTitle = relatedIsFallback ? "Quizás te interese" : `Relacionado con ${category?.name ?? "esto"}`;

  const hasSidebar = related.length > 0;
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

          {category && (
            <div className="text-xs font-medium tracking-wide text-accent uppercase">
              <span>{category.name}</span>
            </div>
          )}

          <h1 className="mt-4 text-2xl leading-tight font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {place.name}
          </h1>

          {mapsUrl && (
            <div className="mt-6 border-b border-border pb-6">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-foreground/[0.08] bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent/50 hover:text-accent"
              >
                <MapPin className="h-4 w-4 text-accent" aria-hidden="true" />
                Ver ubicación en Google Maps
              </a>
              {/* Sin API key: el embed simple de Google Maps (output=embed) no la
                  necesita, a diferencia de la Maps JavaScript API — suficiente para
                  mostrar un mapa estático interactivo, no hace falta el widget
                  completo de LocationPicker (ese es para elegir un punto, acá solo
                  se muestra uno ya fijo). */}
              <div className="mt-4 aspect-video w-full overflow-hidden rounded-2xl border border-border shadow-sm">
                <iframe
                  src={`https://maps.google.com/maps?q=${place.latitude},${place.longitude}&z=15&output=embed`}
                  title={`Mapa de ${place.name}`}
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          )}

          <ContentImageGallery
            images={place.images}
            alt={place.name}
            spacing="mt-8"
            background="bg-canvas-strong"
            fallback={<NoImagePlaceholder />}
          />

          <ContentVideoGallery videos={place.videos} title={place.name} />

          {place.excerpt && (
            <p className="mt-8 text-lg leading-relaxed font-medium text-foreground/90">{place.excerpt}</p>
          )}

          {/* place.body es HTML ya sanitizado en el backend (HtmlSanitizer, whitelist
              de tags) antes de persistirse — nunca se renderiza HTML sin pasar por ahí. */}
          <div
            className="prose prose-slate sm:prose-lg mt-6 max-w-none prose-headings:font-bold prose-a:text-accent"
            dangerouslySetInnerHTML={{ __html: place.body }}
          />

          <div className="mt-10">
            <AdBlock position="article" />
          </div>

          <LikeShareBar contentType="places" slug={place.slug} initialLikeCount={place.likeCount} title={place.name} />
        </article>

        {hasSidebar && (
          <aside className="mt-14 lg:col-span-4 lg:mt-0">
            <div className="lg:sticky lg:top-24 lg:space-y-8">
              <AdBlock position="listing" className="aspect-[16/9] rounded-2xl" />
              <RelatedFeed items={related} title={relatedTitle} categoryNames={categoryNames} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
