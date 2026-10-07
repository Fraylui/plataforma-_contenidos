import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryById, getPlatformSettings, getPublishedGalleryBySlug, getRelatedWithFallback } from "@/lib/api/client";
import { NotFoundError } from "@/lib/api/client";
import { LikeShareBar } from "@/components/content/like-share-bar";
import { AdBlock } from "@/components/legal/ad-block";
import { PostView } from "@/components/post/post-view";
import { PostDetailMedia } from "@/components/post/post-detail-media";
import { headerTimeFor } from "@/components/post/post-header";
import { KIND_LABEL } from "@/lib/content-kind";
import { fromFeedItem } from "@/lib/home-items";
import { imageUrl } from "@/lib/image-url";
import { SITE_URL } from "@/lib/site-url";
import type { Category, ContentImage, Gallery } from "@/lib/api/types";

/** "Más como esto": 3 filas de la cuadrícula de 3. */
const MORE_SIZE = 9;

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

// Ninguna ruta se genera en el build (el contenido vive en la base, no en
// el repo): cada una se genera la primera vez que alguien la visita y
// queda en caché (ISR) hasta que vence su revalidación o el panel la
// invalida (lib/cache-tags.ts). Sin esto Next la trataba como dinámica y
// la volvía a generar en cada visita (ver docs de generateStaticParams).
export function generateStaticParams() {
  return [];
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

  const [category, settings, relatedPage] = await Promise.all([
    getCategoryById(gallery.categoryId).catch(() => null),
    getPlatformSettings(),
    getRelatedWithFallback({ excludeType: "GALLERY", excludeId: gallery.id, categoryId: gallery.categoryId, size: MORE_SIZE }),
  ]);

  return (
    <>
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

      <PostView
        variant="visual"
        brand={{ name: settings.name, logoUrl: settings.logoUrl ?? null }}
        typeLabel={KIND_LABEL.galeria}
        categoryName={category?.name}
        time={headerTimeFor({ kind: "galeria", sortDate: gallery.publishedAt ?? "" })}
        title={gallery.title}
        media={<PostDetailMedia images={gallery.images} videos={[]} title={gallery.title} />}
        excerpt={gallery.excerpt}
        actions={<LikeShareBar contentType="galleries" slug={gallery.slug} initialLikeCount={gallery.likeCount} title={gallery.title} />}
        ad={<AdBlock position="article" section="GALLERY" categoryId={gallery.categoryId} layout="band" count={2} />}
        more={[...relatedPage.related, ...relatedPage.more].map(fromFeedItem)}
      />
    </>
  );
}
