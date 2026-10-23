import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryById, getPlatformSettings, getPublishedGalleryBySlug, getRelatedWithFallback } from "@/lib/api/client";
import { NotFoundError } from "@/lib/api/client";
import { FloatingReactions } from "@/components/post/immersive/floating-reactions";
import { heroCover } from "@/components/post/immersive/immersive-hero";
import { PhotoStack } from "@/components/post/immersive/photo-stack";
import { ViewBeacon } from "@/components/content/view-beacon";
import { AdBlock } from "@/components/legal/ad-block";
import { PostView } from "@/components/post/post-view";
import { headerTimeFor } from "@/components/post/post-header";
import { KIND_LABEL } from "@/lib/content-kind";
import { fromFeedItem, splitUpNext } from "@/lib/home-items";
import { SITE_URL } from "@/lib/site-url";
import type { Category, Gallery } from "@/lib/api/types";
import { contentImageUrl, robotsWithLargePreview, shareImageUrl } from "@/lib/share-image";
import { orNull } from "@/lib/server-log";

/** "Más como esto": 3 filas de la cuadrícula de 3. */
const MORE_SIZE = 9;

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
  const coverImage = shareImageUrl(gallery);

  return {
    title,
    description,
    alternates: { canonical: gallery.canonicalUrl || `/galerias/${slug}` },
    robots: robotsWithLargePreview(gallery.robots),
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
    image: gallery.images.map(contentImageUrl).filter(Boolean),
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
    getCategoryById(gallery.categoryId).catch(orNull("galeria.tema")),
    getPlatformSettings(),
    getRelatedWithFallback({ excludeType: "GALLERY", excludeId: gallery.id, categoryId: gallery.categoryId, size: MORE_SIZE }),
  ]);
  const { upNext, more } = splitUpNext([...relatedPage.related, ...relatedPage.more].map(fromFeedItem));

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
        variant="immersive"
        cover={heroCover(gallery.images, [])}
        brand={{ name: settings.name, logoUrl: settings.logoUrl ?? null }}
        typeLabel={KIND_LABEL.galeria}
        categoryName={category?.name}
        time={headerTimeFor({ kind: "galeria", sortDate: gallery.publishedAt ?? "" })}
        title={gallery.title}
        // Las fotos en vertical (no carrusel): una galería se recorre bajando, como Instagram.
        media={<PhotoStack images={gallery.images.slice(1)} alt={gallery.title} />}
        excerpt={gallery.excerpt}
        actions={<ViewBeacon type="GALLERY" id={gallery.id} />}
        reactions={<FloatingReactions contentType="galleries" slug={gallery.slug} initialLikeCount={gallery.likeCount} title={gallery.title} />}
        upNext={upNext}
        ad={<AdBlock position="article" section="GALLERY" categoryId={gallery.categoryId} layout="band" count={2} />}
        more={more}
      />
    </>
  );
}
