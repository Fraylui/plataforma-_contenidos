import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import {
  getCategoryById,
  getGeographyUnitById,
  getPlatformSettings,
  getPublishedPlaceById,
  getPublishedReviewBySlug,
  listPublishedArticles,
  listPublishedPlaces,
  listPublishedReviews,
} from "@/lib/api/client";
import { NotFoundError } from "@/lib/api/client";
import { YouTubeEmbed } from "@/components/article/youtube-embed";
import { ArticleCard } from "@/components/article/article-card";
import { PlaceCard } from "@/components/place/place-card";
import { ReviewCard } from "@/components/review/review-card";
import { StarRating } from "@/components/review/star-rating";
import { LikeShareBar } from "@/components/content/like-share-bar";
import { AdBlock } from "@/components/legal/ad-block";
import { serverImageUrl } from "@/lib/server-image-url";
import { SITE_URL } from "@/lib/site-url";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";
import type { Category, Review } from "@/lib/api/types";

const RELATED_SIZE = 4;

async function loadReview(slug: string) {
  try {
    return await getPublishedReviewBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }
}

export async function generateMetadata(props: PageProps<"/resenas/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  let review;
  try {
    review = await getPublishedReviewBySlug(slug);
  } catch {
    return {};
  }
  const settings = await getPlatformSettings();

  const title = review.seoTitle || review.title;
  const description = review.metaDescription || review.excerpt || undefined;

  return {
    title,
    description,
    alternates: { canonical: review.canonicalUrl || `/resenas/${slug}` },
    robots: review.robots,
    openGraph: {
      title,
      description,
      type: "website",
      images: review.ogImageUrl ? [review.ogImageUrl] : undefined,
      siteName: settings.name,
    },
  };
}

function reviewJsonLd(
  review: Review,
  category: Category | null,
  siteName: string,
  subject: { name: string; slug?: string } | null,
) {
  const url = review.canonicalUrl || `${SITE_URL}/resenas/${review.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    name: review.title,
    reviewBody: review.excerpt || undefined,
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    itemReviewed: subject
      ? {
          "@type": "Thing",
          name: subject.name,
          url: subject.slug ? `${SITE_URL}/lugares/${subject.slug}` : undefined,
        }
      : undefined,
    author: { "@type": "Organization", name: siteName },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(category ? { about: category.name } : {}),
  };
}

export default async function ReviewPage(props: PageProps<"/resenas/[slug]">) {
  const { slug } = await props.params;
  const review = await loadReview(slug);

  const [category, geography, settings, place] = await Promise.all([
    getCategoryById(review.categoryId).catch(() => null),
    review.geographyId ? getGeographyUnitById(review.geographyId).catch(() => null) : Promise.resolve(null),
    getPlatformSettings(),
    review.placeId ? getPublishedPlaceById(review.placeId).catch(() => null) : Promise.resolve(null),
  ]);

  const [relatedReviewsResult, relatedPlacesResult, relatedArticlesResult] = category
    ? await Promise.all([
        listPublishedReviews({ categoryId: category.id, size: RELATED_SIZE + 1 }),
        listPublishedPlaces({ categoryId: category.id, size: RELATED_SIZE }),
        listPublishedArticles({ categoryId: category.id, size: RELATED_SIZE }),
      ])
    : [null, null, null];
  const relatedReviews = (relatedReviewsResult?.items ?? [])
    .filter((r) => r.id !== review.id)
    .slice(0, RELATED_SIZE);
  const relatedPlaces = relatedPlacesResult?.items ?? [];
  const relatedArticles = relatedArticlesResult?.items ?? [];

  const subject = place ? { name: place.name, slug: place.slug } : review.subjectName ? { name: review.subjectName } : null;
  const [heroImageId, ...galleryImageIds] = review.imageIds;
  const hasSidebar = relatedReviews.length > 0 || relatedPlaces.length > 0 || relatedArticles.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(reviewJsonLd(review, category, settings.name, subject)).replace(/</g, "\\u003c"),
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
                <Link href="/resenas" className="hover:text-accent hover:underline">
                  Reseñas
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
                {review.title}
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide text-accent uppercase">
            <span>Reseña</span>
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
            {review.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border pb-6 text-xs text-muted sm:text-sm">
            <StarRating rating={review.rating} size="lg" />
            {subject &&
              (subject.slug ? (
                <Link href={`/lugares/${subject.slug}`} className="inline-flex items-center gap-1.5 hover:text-accent hover:underline">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {subject.name}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {subject.name}
                </span>
              ))}
            {geography && <span>{geography.name}</span>}
          </div>

          {heroImageId ? (
            <div className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl border border-border bg-canvas-strong shadow-lg">
              <SkeletonImage src={serverImageUrl(`/api/v1/images/${heroImageId}/file`)} alt={review.title} className="object-cover" />
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
                    alt={`${review.title} — fotografía ${index + 2}`}
                    className="object-cover"
                    sizes="180px"
                  />
                </div>
              ))}
            </div>
          )}

          {review.youtubeVideoId && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-border shadow-lg">
              <YouTubeEmbed videoId={review.youtubeVideoId} title={review.title} />
            </div>
          )}

          {review.excerpt && (
            <p className="mt-8 text-lg leading-relaxed font-medium text-foreground/90">{review.excerpt}</p>
          )}

          <div className="mt-6 max-w-none text-base leading-relaxed whitespace-pre-line text-foreground">
            {review.body}
          </div>

          <div className="mt-10">
            <AdBlock position="article" />
          </div>

          <LikeShareBar contentType="reviews" slug={review.slug} initialLikeCount={review.likeCount} title={review.title} />
        </article>

        {hasSidebar && (
          <aside className="mt-14 lg:col-span-4 lg:mt-0">
            <div className="space-y-10 lg:sticky lg:top-24">
              {relatedReviews.length > 0 && (
                <section aria-label="Otras reseñas">
                  <h2 className="text-lg font-semibold text-foreground">Otras reseñas en {category!.name}</h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    {relatedReviews.map((related) => (
                      <ReviewCard key={related.id} review={related} />
                    ))}
                  </div>
                </section>
              )}

              {relatedPlaces.length > 0 && (
                <section aria-label="Lugares relacionados">
                  <h2 className="text-lg font-semibold text-foreground">Lugares en {category!.name}</h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    {relatedPlaces.map((related) => (
                      <PlaceCard key={related.id} place={related} />
                    ))}
                  </div>
                </section>
              )}

              {relatedArticles.length > 0 && (
                <section aria-label="Más publicaciones">
                  <h2 className="text-lg font-semibold text-foreground">Más de {category!.name}</h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    {relatedArticles.map((related) => (
                      <ArticleCard key={related.id} article={related} />
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
