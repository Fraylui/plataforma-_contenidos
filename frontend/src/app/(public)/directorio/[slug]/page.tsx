import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import {
  getCategoryById,
  getGeographyUnitById,
  getPlatformSettings,
  getPublishedBusinessBySlug,
  getPublishedPlaceById,
  listPublishedBusinesses,
} from "@/lib/api/client";
import { NotFoundError } from "@/lib/api/client";
import { YouTubeEmbed } from "@/components/article/youtube-embed";
import { BusinessCard } from "@/components/directory/business-card";
import { businessTypeLabel } from "@/lib/content-labels";
import { imageUrl } from "@/lib/image-url";
import { serverImageUrl } from "@/lib/server-image-url";
import { SITE_URL } from "@/lib/site-url";
import { AdBlock } from "@/components/legal/ad-block";
import { LikeShareBar } from "@/components/content/like-share-bar";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";
import type { Business, Category } from "@/lib/api/types";

const RELATED_SIZE = 4;

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
    image: business.imageIds.length > 0 ? imageUrl(`/api/v1/images/${business.imageIds[0]}/file`) : undefined,
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

export default async function BusinessPage(props: PageProps<"/directorio/[slug]">) {
  const { slug } = await props.params;
  const business = await loadBusiness(slug);

  const [category, geography, place] = await Promise.all([
    getCategoryById(business.categoryId).catch(() => null),
    business.geographyId ? getGeographyUnitById(business.geographyId).catch(() => null) : Promise.resolve(null),
    business.placeId ? getPublishedPlaceById(business.placeId).catch(() => null) : Promise.resolve(null),
  ]);

  const relatedResult = await listPublishedBusinesses({
    businessType: business.businessType,
    size: RELATED_SIZE + 1,
  });
  const related = relatedResult.items.filter((b) => b.id !== business.id).slice(0, RELATED_SIZE);

  const [heroImageId, ...galleryImageIds] = business.imageIds;
  const hasSidebar = related.length > 0;
  const hasContact = Boolean(place || business.address || business.phone || business.email || business.website);
  const websiteLabel = business.website ? business.website.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(businessJsonLd(business, category)).replace(/</g, "\\u003c"),
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
                <Link href="/directorio" className="hover:text-accent hover:underline">
                  Directorio
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="max-w-[12rem] truncate text-foreground/80 sm:max-w-[24rem]" aria-current="page">
                {business.name}
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide text-accent uppercase">
            <span>{businessTypeLabel(business.businessType)}</span>
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
            {business.name}
          </h1>

          {geography && <p className="mt-2 text-sm text-muted">{geography.name}</p>}

          {heroImageId ? (
            <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl border border-border bg-canvas-strong shadow-lg">
              <SkeletonImage src={serverImageUrl(`/api/v1/images/${heroImageId}/file`)} alt={business.name} className="object-cover" />
            </div>
          ) : (
            <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl border border-border bg-canvas-strong shadow-lg">
              <NoImagePlaceholder />
            </div>
          )}

          {galleryImageIds.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {galleryImageIds.map((id, index) => (
                <div key={id} className="relative aspect-square overflow-hidden rounded-lg border border-border bg-canvas-strong">
                  <SkeletonImage
                    src={serverImageUrl(`/api/v1/images/${id}/file`)}
                    alt={`${business.name} — fotografía ${index + 2}`}
                    className="object-cover"
                    sizes="180px"
                  />
                </div>
              ))}
            </div>
          )}

          {hasContact && (
            <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:grid-cols-2">
              {(place || business.address) && (
                <div className="flex items-start gap-2.5 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-semibold tracking-wide text-muted uppercase">Dirección</div>
                    {place ? (
                      <Link href={`/lugares/${place.slug}`} className="font-medium text-foreground hover:text-accent hover:underline">
                        {place.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-foreground">{business.address}</span>
                    )}
                  </div>
                </div>
              )}
              {business.phone && (
                <div className="flex items-start gap-2.5 text-sm">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-semibold tracking-wide text-muted uppercase">Teléfono</div>
                    <a href={`tel:${business.phone}`} className="font-medium text-foreground hover:text-accent hover:underline">
                      {business.phone}
                    </a>
                  </div>
                </div>
              )}
              {business.email && (
                <div className="flex items-start gap-2.5 text-sm">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-semibold tracking-wide text-muted uppercase">Email</div>
                    <a href={`mailto:${business.email}`} className="font-medium break-all text-foreground hover:text-accent hover:underline">
                      {business.email}
                    </a>
                  </div>
                </div>
              )}
              {business.website && (
                <div className="flex items-start gap-2.5 text-sm">
                  <Globe className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-semibold tracking-wide text-muted uppercase">Web</div>
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium break-all text-foreground hover:text-accent hover:underline"
                    >
                      {websiteLabel}
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {business.youtubeVideoId && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-border shadow-lg">
              <YouTubeEmbed videoId={business.youtubeVideoId} title={business.name} />
            </div>
          )}

          {business.excerpt && (
            <p className="mt-8 text-lg leading-relaxed font-medium text-foreground/90">{business.excerpt}</p>
          )}

          <div className="mt-6 max-w-none text-base leading-relaxed whitespace-pre-line text-foreground">
            {business.body}
          </div>

          <div className="mt-10">
            <AdBlock position="article" />
          </div>

          <LikeShareBar contentType="directory" slug={business.slug} initialLikeCount={business.likeCount} title={business.name} />
        </article>

        {hasSidebar && (
          <aside className="mt-14 lg:col-span-4 lg:mt-0">
            <div className="lg:sticky lg:top-24">
              <section aria-label="Más en el directorio">
                <h2 className="text-lg font-semibold text-foreground">
                  Más {businessTypeLabel(business.businessType).toLowerCase()}s
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  {related.map((item) => (
                    <BusinessCard key={item.id} business={item} />
                  ))}
                </div>
              </section>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
