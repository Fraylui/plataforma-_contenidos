import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
import { SITE_URL } from "@/lib/site-url";
import { AdBlock } from "@/components/legal/ad-block";
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

  return (
    <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(businessJsonLd(business, category)).replace(/</g, "\\u003c"),
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
            <Link href="/directorio" className="hover:text-accent hover:underline">
              Directorio
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="max-w-[24rem] truncate text-foreground/80" aria-current="page">
            {business.name}
          </li>
        </ol>
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide text-accent uppercase">
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

      <h1 className="mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
        {business.name}
      </h1>

      <dl className="mt-4 space-y-1 text-sm text-muted">
        {(place || business.address) && (
          <div className="flex gap-2">
            <dt className="font-medium text-foreground/80">Dirección</dt>
            <dd>
              {place ? (
                <Link href={`/lugares/${place.slug}`} className="hover:text-accent hover:underline">
                  {place.name}
                </Link>
              ) : (
                business.address
              )}
            </dd>
          </div>
        )}
        {business.phone && (
          <div className="flex gap-2">
            <dt className="font-medium text-foreground/80">Teléfono</dt>
            <dd>{business.phone}</dd>
          </div>
        )}
        {business.website && (
          <div className="flex gap-2">
            <dt className="font-medium text-foreground/80">Web</dt>
            <dd>
              <a href={business.website} target="_blank" rel="noopener noreferrer" className="hover:text-accent hover:underline">
                {business.website}
              </a>
            </dd>
          </div>
        )}
        {geography && (
          <div className="flex gap-2">
            <dt className="font-medium text-foreground/80">Zona</dt>
            <dd>{geography.name}</dd>
          </div>
        )}
      </dl>

      {business.imageIds.length > 0 && (
        // eslint-disable-next-line @next/next/no-img-element -- host propio del backend
        <img
          src={imageUrl(`/api/v1/images/${business.imageIds[0]}/file`)}
          alt={business.name}
          className="mt-8 aspect-video w-full rounded-lg object-cover"
        />
      )}

      {business.youtubeVideoId && (
        <div className="mt-8">
          <YouTubeEmbed videoId={business.youtubeVideoId} title={business.name} />
        </div>
      )}

      {business.excerpt && (
        <p className="mt-8 text-lg leading-relaxed text-foreground/90">{business.excerpt}</p>
      )}

      <div className="mt-6 max-w-[70ch] text-base leading-relaxed whitespace-pre-line text-foreground">
        {business.body}
      </div>

      <div className="mt-10">
        <AdBlock position="article" />
      </div>

      {related.length > 0 && (
        <div className="mt-14 max-w-none border-t border-border pt-10">
          <section aria-label="Más en el directorio">
            <h2 className="text-lg font-semibold text-foreground">
              Más {businessTypeLabel(business.businessType).toLowerCase()}s
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {related.map((item) => (
                <BusinessCard key={item.id} business={item} />
              ))}
            </div>
          </section>
        </div>
      )}
    </article>
  );
}
