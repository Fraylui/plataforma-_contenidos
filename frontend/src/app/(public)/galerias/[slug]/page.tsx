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
import { imageUrl } from "@/lib/image-url";
import { SITE_URL } from "@/lib/site-url";
import type { Category, Gallery } from "@/lib/api/types";

const RELATED_SIZE = 4;

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
  const coverImage = gallery.imageIds[0] ? imageUrl(`/api/v1/images/${gallery.imageIds[0]}/file`) : gallery.ogImageUrl;

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
    image: gallery.imageIds.map((id) => imageUrl(`/api/v1/images/${id}/file`)),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(category ? { keywords: category.name } : {}),
    publisher: { "@type": "Organization", name: siteName },
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

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide text-accent uppercase">
        <span>Galería · {gallery.imageIds.length} fotos</span>
        {category && (
          <>
            <span aria-hidden="true" className="text-border">
              ·
            </span>
            <span>{category.name}</span>
          </>
        )}
      </div>

      <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
        {gallery.title}
      </h1>

      {gallery.excerpt && (
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-foreground/90">
          {gallery.excerpt}
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {gallery.imageIds.map((id, index) => (
          // eslint-disable-next-line @next/next/no-img-element -- host propio del backend
          <img
            key={id}
            src={imageUrl(`/api/v1/images/${id}/file`)}
            alt={`${gallery.title} — fotografía ${index + 1}`}
            className="aspect-square w-full rounded-md object-cover"
          />
        ))}
      </div>

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
              aria-label="Más artículos"
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
