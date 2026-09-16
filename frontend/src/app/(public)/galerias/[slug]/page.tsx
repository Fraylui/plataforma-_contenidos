import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategoryById,
  getPlatformSettings,
  getPublishedGalleryBySlug,
  listPublishedArticles,
  listPublishedGalleries,
  listPublishedPlaces,
} from "@/lib/api/client";
import { NotFoundError } from "@/lib/api/client";
import { ArticleCard } from "@/components/article/article-card";
import { PlaceCard } from "@/components/place/place-card";
import { GalleryCard } from "@/components/gallery/gallery-card";
import { LikeShareBar } from "@/components/content/like-share-bar";
import { ContentImageGallery } from "@/components/content/content-image-gallery";
import { imageUrl } from "@/lib/image-url";
import { SITE_URL } from "@/lib/site-url";
import type { Category, ContentImage, Gallery } from "@/lib/api/types";

const RELATED_SIZE = 4;

/** Subida (imageUrl propia) o por enlace externo — nunca ambas, ver ContentImage. */
function resolveImageUrl(image: ContentImage): string {
  return image.imageId ? imageUrl(`/api/v1/images/${image.imageId}/file`) : (image.externalUrl ?? "");
}

async function loadGallery(slug: string) {
  try {
    return await getPublishedGalleryBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }
}

export async function generateMetadata(props: PageProps<"/galerias/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  let gallery;
  try {
    gallery = await getPublishedGalleryBySlug(slug);
  } catch {
    return {};
  }
  const settings = await getPlatformSettings();

  const title = gallery.seoTitle || gallery.title;
  const description = gallery.metaDescription || gallery.excerpt || undefined;
  const coverImage = gallery.images[0] ? resolveImageUrl(gallery.images[0]) : gallery.ogImageUrl;

  return {
    title,
    description,
    alternates: { canonical: gallery.canonicalUrl || `/galerias/${slug}` },
    robots: gallery.robots,
    openGraph: {
      title,
      description,
      type: "website",
      images: coverImage ? [coverImage] : undefined,
      siteName: settings.name,
    },
  };
}

function galleryJsonLd(gallery: Gallery, category: Category | null, siteName: string) {
  const url = gallery.canonicalUrl || `${SITE_URL}/galerias/${gallery.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: gallery.title,
    description: gallery.metaDescription || gallery.excerpt || undefined,
    image: gallery.images.map(resolveImageUrl),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(category ? { keywords: category.name } : {}),
    publisher: { "@type": "Organization", name: siteName },
  };
}

function breadcrumbJsonLd(gallery: Gallery, category: Category | null) {
  const items = [
    { name: "Inicio", url: SITE_URL },
    { name: "Galerías", url: `${SITE_URL}/galerias` },
    ...(category ? [{ name: category.name, url: `${SITE_URL}/categorias/${category.slug}` }] : []),
    { name: gallery.title, url: `${SITE_URL}/galerias/${gallery.slug}` },
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

export default async function GalleryPage(props: PageProps<"/galerias/[slug]">) {
  const { slug } = await props.params;
  const gallery = await loadGallery(slug);

  const [category, settings] = await Promise.all([
    getCategoryById(gallery.categoryId).catch(() => null),
    getPlatformSettings(),
  ]);

  const [relatedGalleriesResult, relatedPlacesResult, relatedArticlesResult] = category
    ? await Promise.all([
        listPublishedGalleries({ categoryId: category.id, size: RELATED_SIZE + 1 }),
        listPublishedPlaces({ categoryId: category.id, size: RELATED_SIZE }),
        listPublishedArticles({ categoryId: category.id, size: RELATED_SIZE }),
      ])
    : [null, null, null];
  const relatedGalleries = (relatedGalleriesResult?.items ?? [])
    .filter((g) => g.id !== gallery.id)
    .slice(0, RELATED_SIZE);
  const relatedPlaces = relatedPlacesResult?.items ?? [];
  const relatedArticles = relatedArticlesResult?.items ?? [];

  return (
    <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(galleryJsonLd(gallery, category, settings.name)).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(gallery, category)).replace(/</g, "\\u003c"),
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
            <Link href="/galerias" className="hover:text-accent hover:underline">
              Galerías
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
            {gallery.title}
          </li>
        </ol>
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide uppercase">
        {category && <span className="text-accent">{category.name}</span>}
        <span className={category ? "text-muted normal-case" : "text-accent"}>
          {category && "· "}
          {gallery.images.length} foto{gallery.images.length === 1 ? "" : "s"}
        </span>
      </div>

      <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
        {gallery.title}
      </h1>

      {gallery.excerpt && (
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-foreground/90">
          {gallery.excerpt}
        </p>
      )}

      <ContentImageGallery images={gallery.images} alt={gallery.title} spacing="mt-8" />

      <LikeShareBar contentType="galleries" slug={gallery.slug} initialLikeCount={gallery.likeCount} title={gallery.title} />

      {(relatedGalleries.length > 0 || relatedPlaces.length > 0 || relatedArticles.length > 0) && (
        <div className="mt-14 max-w-none border-t border-border pt-10">
          {relatedGalleries.length > 0 && (
            <section aria-label="Otras galerías">
              <h2 className="text-lg font-semibold text-foreground">Otras galerías en {category!.name}</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedGalleries.map((related) => (
                  <GalleryCard key={related.id} gallery={related} />
                ))}
              </div>
            </section>
          )}

          {relatedPlaces.length > 0 && (
            <section aria-label="Lugares relacionados" className={relatedGalleries.length > 0 ? "mt-10" : undefined}>
              <h2 className="text-lg font-semibold text-foreground">Lugares en {category!.name}</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPlaces.map((related) => (
                  <PlaceCard key={related.id} place={related} />
                ))}
              </div>
            </section>
          )}

          {relatedArticles.length > 0 && (
            <section
              aria-label="Más publicaciones"
              className={relatedGalleries.length > 0 || relatedPlaces.length > 0 ? "mt-10" : undefined}
            >
              <h2 className="text-lg font-semibold text-foreground">Más de {category!.name}</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
