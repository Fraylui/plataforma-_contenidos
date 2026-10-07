import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Envelope, Globe, MapPin, NavigationArrow, Phone, Storefront } from "@phosphor-icons/react/dist/ssr";
import {
  getCategoryById,
  getPlatformSettings,
  getPublishedBusinessBySlug,
  getPublishedPlaceById,
  getRelatedWithFallback,
} from "@/lib/api/client";
import { NotFoundError } from "@/lib/api/client";
import { businessTypeLabel } from "@/lib/content-labels";
import { imageUrl } from "@/lib/image-url";
import { SITE_URL } from "@/lib/site-url";
import { AdBlock } from "@/components/legal/ad-block";
import { LikeShareBar, POST_ACTION_PILL } from "@/components/content/like-share-bar";
import { PostView } from "@/components/post/post-view";
import { PostDetailMedia } from "@/components/post/post-detail-media";
import { PostFacts, type PostFact } from "@/components/post/post-facts";
import { headerTimeFor } from "@/components/post/post-header";
import { mapsDirections } from "@/components/post/post-actions";
import { KIND_LABEL } from "@/lib/content-kind";
import { fromFeedItem } from "@/lib/home-items";
import type { Business, Category } from "@/lib/api/types";
import { VideoJsonLd } from "@/components/seo/video-json-ld";

/** "Más como esto": 3 filas de la cuadrícula de 3. */
const MORE_SIZE = 9;

async function loadBusiness(slug: string) {
  try {
    return await getPublishedBusinessBySlug(slug);
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

export async function generateMetadata(props: PageProps<"/directorio/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  let business;
  try {
    business = await getPublishedBusinessBySlug(slug);
  } catch {
    return {};
  }
  const settings = await getPlatformSettings();

  const title = business.seoTitle || business.name;
  const description = business.metaDescription || business.excerpt || undefined;

  return {
    title,
    description,
    alternates: { canonical: business.canonicalUrl || `/directorio/${slug}` },
    robots: business.robots,
    openGraph: {
      title,
      description,
      type: "website",
      images: business.ogImageUrl ? [business.ogImageUrl] : undefined,
      siteName: settings.name,
    },
  };
}

function businessJsonLd(business: Business, category: Category | null) {
  const url = business.canonicalUrl || `${SITE_URL}/directorio/${business.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: business.excerpt || undefined,
    image: business.images[0]
      ? (business.images[0].imageId
          ? imageUrl(`/api/v1/images/${business.images[0].imageId}/file`)
          : (business.images[0].externalUrl ?? undefined))
      : undefined,
    address: business.address || undefined,
    telephone: business.phone || undefined,
    email: business.email || undefined,
    url: business.website || url,
    geo:
      business.latitude != null && business.longitude != null
        ? { "@type": "GeoCoordinates", latitude: business.latitude, longitude: business.longitude }
        : undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(category ? { category: category.name } : {}),
  };
}

function breadcrumbJsonLd(business: Business, category: Category | null) {
  const items = [
    { name: "Inicio", url: SITE_URL },
    { name: "Directorio", url: `${SITE_URL}/directorio` },
    ...(category ? [{ name: category.name, url: `${SITE_URL}/categorias/${category.slug}` }] : []),
    { name: business.name, url: `${SITE_URL}/directorio/${business.slug}` },
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

export default async function BusinessPage(props: PageProps<"/directorio/[slug]">) {
  const { slug } = await props.params;
  const business = await loadBusiness(slug);

  const [category, place, settings, relatedPage] = await Promise.all([
    getCategoryById(business.categoryId).catch(() => null),
    business.placeId ? getPublishedPlaceById(business.placeId).catch(() => null) : Promise.resolve(null),
    getPlatformSettings(),
    getRelatedWithFallback({ excludeType: "BUSINESS", excludeId: business.id, categoryId: business.categoryId, size: MORE_SIZE }),
  ]);

  const websiteLabel = business.website ? business.website.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;
  const facts: PostFact[] = [
    { icon: Storefront, label: "Rubro", value: businessTypeLabel(business.businessType) },
    ...(place
      ? [{ icon: MapPin, label: "Dirección", value: place.name, href: `/lugares/${place.slug}` }]
      : business.address
        ? [{ icon: MapPin, label: "Dirección", value: business.address }]
        : []),
    ...(business.phone ? [{ icon: Phone, label: "Teléfono", value: business.phone, href: `tel:${business.phone.replace(/[^\d+]/g, "")}` }] : []),
    ...(business.email ? [{ icon: Envelope, label: "Correo", value: business.email, href: `mailto:${business.email}` }] : []),
    ...(business.website && websiteLabel ? [{ icon: Globe, label: "Sitio web", value: websiteLabel, href: business.website, external: true }] : []),
  ];
  const hasMap = business.latitude != null && business.longitude != null;

  return (
    <>
      <VideoJsonLd
        videos={business.videos}
        fallbackTitle={business.name}
        description={business.metaDescription || business.excerpt}
        uploadDate={business.publishedAt}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(businessJsonLd(business, category)).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(business, category)).replace(/</g, "\\u003c"),
        }}
      />

      <PostView
        variant="visual"
        brand={{ name: settings.name, logoUrl: settings.logoUrl ?? null }}
        typeLabel={KIND_LABEL.directorio}
        categoryName={category?.name}
        time={headerTimeFor({ kind: "directorio", sortDate: business.publishedAt ?? "" })}
        title={business.name}
        media={<PostDetailMedia images={business.images} videos={business.videos} title={business.name} />}
        excerpt={business.excerpt}
        facts={<PostFacts facts={facts} />}
        body={
          // business.body es HTML ya sanitizado en el backend (HtmlSanitizer, whitelist
          // de tags) antes de persistirse — nunca se renderiza HTML sin pasar por ahí.
          <div className="prose prose-theme max-w-none prose-headings:font-bold prose-a:text-accent" dangerouslySetInnerHTML={{ __html: business.body }} />
        }
        actions={
          <LikeShareBar contentType="directory" slug={business.slug} initialLikeCount={business.likeCount} title={business.name}>
            {business.phone && (
              <a href={`tel:${business.phone.replace(/[^\d+]/g, "")}`} className={POST_ACTION_PILL}>
                <Phone className="h-4 w-4" aria-hidden="true" />
                Llamar
              </a>
            )}
            {hasMap && (
              <a href={mapsDirections(business.latitude!, business.longitude!)} target="_blank" rel="noopener noreferrer" className={POST_ACTION_PILL}>
                <NavigationArrow className="h-4 w-4" aria-hidden="true" />
                Cómo llegar
              </a>
            )}
          </LikeShareBar>
        }
        ad={<AdBlock position="article" section="BUSINESS" categoryId={business.categoryId} layout="band" count={2} />}
        more={[...relatedPage.related, ...relatedPage.more].map(fromFeedItem)}
      />
    </>
  );
}
