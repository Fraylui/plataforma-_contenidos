import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NavigationArrow } from "@phosphor-icons/react/dist/ssr";
import { getCategoryById, getPlatformSettings, getPublishedPlaceBySlug, getRelatedWithFallback } from "@/lib/api/client";
import { NotFoundError } from "@/lib/api/client";
import { LikeShareBar, POST_ACTION_PILL } from "@/components/content/like-share-bar";
import { AdBlock } from "@/components/legal/ad-block";
import { PostView } from "@/components/post/post-view";
import { PostDetailMedia } from "@/components/post/post-detail-media";
import { PostFacts } from "@/components/post/post-facts";
import { headerTimeFor } from "@/components/post/post-header";
import { mapsDirections } from "@/components/post/post-actions";
import { KIND_LABEL } from "@/lib/content-kind";
import { fromFeedItem } from "@/lib/home-items";
import { imageUrl } from "@/lib/image-url";
import { SITE_URL } from "@/lib/site-url";
import type { Category, ContentImage, Place } from "@/lib/api/types";
import { VideoJsonLd } from "@/components/seo/video-json-ld";

/** "Más como esto": 3 filas de la cuadrícula de 3. */
const MORE_SIZE = 9;

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

// Ninguna ruta se genera en el build (el contenido vive en la base, no en
// el repo): cada una se genera la primera vez que alguien la visita y
// queda en caché (ISR) hasta que vence su revalidación o el panel la
// invalida (lib/cache-tags.ts). Sin esto Next la trataba como dinámica y
// la volvía a generar en cada visita (ver docs de generateStaticParams).
export function generateStaticParams() {
  return [];
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

  const [category, settings, relatedPage] = await Promise.all([
    getCategoryById(place.categoryId).catch(() => null),
    getPlatformSettings(),
    getRelatedWithFallback({ excludeType: "PLACE", excludeId: place.id, categoryId: place.categoryId, size: MORE_SIZE }),
  ]);

  const map =
    place.latitude != null && place.longitude != null
      ? { latitude: place.latitude, longitude: place.longitude, title: place.name }
      : null;

  return (
    <>
      <VideoJsonLd
        videos={place.videos}
        fallbackTitle={place.name}
        description={place.metaDescription || place.excerpt}
        uploadDate={place.publishedAt}
      />
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

      <PostView
        variant="visual"
        brand={{ name: settings.name, logoUrl: settings.logoUrl ?? null }}
        typeLabel={KIND_LABEL.lugar}
        categoryName={category?.name}
        time={headerTimeFor({ kind: "lugar", sortDate: place.publishedAt ?? "" })}
        title={place.name}
        media={<PostDetailMedia images={place.images} videos={place.videos} title={place.name} />}
        excerpt={place.excerpt}
        facts={map ? <PostFacts facts={[]} map={map} /> : undefined}
        body={
          // place.body es HTML ya sanitizado en el backend (HtmlSanitizer, whitelist
          // de tags) antes de persistirse — nunca se renderiza HTML sin pasar por ahí.
          <div className="prose prose-theme max-w-none prose-headings:font-bold prose-a:text-accent" dangerouslySetInnerHTML={{ __html: place.body }} />
        }
        actions={
          <LikeShareBar contentType="places" slug={place.slug} initialLikeCount={place.likeCount} title={place.name}>
            {map && (
              <a href={mapsDirections(map.latitude, map.longitude)} target="_blank" rel="noopener noreferrer" className={POST_ACTION_PILL}>
                <NavigationArrow className="h-4 w-4" aria-hidden="true" />
                Cómo llegar
              </a>
            )}
          </LikeShareBar>
        }
        ad={<AdBlock position="article" section="PLACE" categoryId={place.categoryId} layout="band" count={2} />}
        more={[...relatedPage.related, ...relatedPage.more].map(fromFeedItem)}
      />
    </>
  );
}
