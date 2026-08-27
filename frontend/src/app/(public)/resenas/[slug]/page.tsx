import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
import { imageUrl } from "@/lib/image-url";
import { SITE_URL } from "@/lib/site-url";
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

  return (
    <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(reviewJsonLd(review, category, settings.name, subject)).replace(/</g, "\\u003c"),
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
          <li className="max-w-[24rem] truncate text-foreground/80" aria-current="page">
            {review.title}
          </li>
        </ol>
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide text-accent uppercase">
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

      <h1 className="mt-3 font-serif text-3xl font-medium leading-tight text-foreground sm:text-4xl">
        {review.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground">
        <StarRating rating={review.rating} size="lg" />
        {subject &&
          (subject.slug ? (
            <Link href={`/lugares/${subject.slug}`} className="text-muted hover:text-accent hover:underline">
              {subject.name}
            </Link>
          ) : (
            <span className="text-muted">{subject.name}</span>
          ))}
        {geography && <span className="text-muted">{geography.name}</span>}
      </div>

      {review.imageIds.length > 0 && (
        // eslint-disable-next-line @next/next/no-img-element -- host propio del backend
        <img
          src={imageUrl(`/api/v1/images/${review.imageIds[0]}/file`)}
          alt={review.title}
          className="mt-8 aspect-video w-full rounded-lg object-cover"
        />
      )}

      {review.youtubeVideoId && (
        <div className="mt-8">
          <YouTubeEmbed videoId={review.youtubeVideoId} title={review.title} />
        </div>
      )}

      {review.excerpt && (
        <p className="mt-8 font-serif text-lg leading-relaxed text-foreground/90 italic">{review.excerpt}</p>
      )}

      <div className="mt-6 max-w-[70ch] text-base leading-relaxed whitespace-pre-line text-foreground">
        {review.body}
      </div>

      {(relatedReviews.length > 0 || relatedPlaces.length > 0 || relatedArticles.length > 0) && (
        <div className="mt-14 max-w-none border-t border-border pt-10">
          {relatedReviews.length > 0 && (
            <section aria-label="Otras reseñas">
              <h2 className="font-serif text-lg font-medium text-foreground">Otras reseñas en {category!.name}</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {relatedReviews.map((related) => (
                  <ReviewCard key={related.id} review={related} />
                ))}
              </div>
            </section>
          )}

          {relatedPlaces.length > 0 && (
            <section aria-label="Lugares relacionados" className={relatedReviews.length > 0 ? "mt-10" : undefined}>
              <h2 className="font-serif text-lg font-medium text-foreground">Lugares en {category!.name}</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {relatedPlaces.map((related) => (
                  <PlaceCard key={related.id} place={related} />
                ))}
              </div>
            </section>
          )}

          {relatedArticles.length > 0 && (
            <section
              aria-label="Más artículos"
              className={relatedReviews.length > 0 || relatedPlaces.length > 0 ? "mt-10" : undefined}
            >
              <h2 className="font-serif text-lg font-medium text-foreground">Más de {category!.name}</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {relatedArticles.map((related) => (
                  <ArticleCard key={related.id} article={related} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </article>
  );
}
