import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryById, getPlatformSettings, getPublishedPublicationBySlug, getRelatedWithFallback } from "@/lib/api/client";
import { NotFoundError } from "@/lib/api/client";
import { LikeShareBar } from "@/components/content/like-share-bar";
import { ViewBeacon } from "@/components/content/view-beacon";
import { AdBlock } from "@/components/legal/ad-block";
import { PostView } from "@/components/post/post-view";
import { PostDetailMedia } from "@/components/post/post-detail-media";
import { headerTimeFor, updatedTimeFor } from "@/components/post/post-header";
import { KIND_LABEL } from "@/lib/content-kind";
import { fromFeedItem } from "@/lib/home-items";
import { SITE_URL } from "@/lib/site-url";
import type { Publication, Category } from "@/lib/api/types";
import { contentImageUrl, robotsWithLargePreview, shareImageUrl } from "@/lib/share-image";
import { VideoJsonLd } from "@/components/seo/video-json-ld";
import { InlineRelated } from "@/components/post/inline-related";
import { WhatsAppFollow } from "@/components/post/whatsapp-follow";
import { splitBodyInHalf } from "@/lib/split-body";

/** "Más como esto": 3 filas de la cuadrícula de 3. */
const MORE_SIZE = 9;

// publication.body es HTML ya sanitizado en el backend (HtmlSanitizer, whitelist
// de tags) antes de persistirse — nunca se renderiza HTML sin pasar por ahí.
// Cita destacada con borde de acento; imágenes y subtítulos sin líneas ni
// sombras (la separación es el espacio, como el resto del sitio).
const PROSE = `prose prose-theme sm:prose-lg max-w-none
  prose-headings:font-bold prose-headings:tracking-tight
  prose-h2:mt-10 prose-h2:text-2xl
  prose-h3:mt-8 prose-h3:text-xl
  prose-a:text-accent
  prose-blockquote:border-l-accent prose-blockquote:not-italic prose-blockquote:font-semibold
  prose-blockquote:text-xl prose-blockquote:leading-snug prose-blockquote:text-foreground
  prose-blockquote:before:content-none prose-blockquote:after:content-none
  prose-img:rounded-2xl`;

async function loadPublication(slug: string) {
  try {
    return await getPublishedPublicationBySlug(slug);
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

export async function generateMetadata(props: PageProps<"/publicaciones/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  let publication;
  try {
    publication = await getPublishedPublicationBySlug(slug);
  } catch {
    return {};
  }
  const settings = await getPlatformSettings();

  const title = publication.seoTitle || publication.title;
  const description = publication.metaDescription || publication.excerpt || undefined;
  const shareImage = shareImageUrl(publication);

  return {
    title,
    description,
    // Por defecto, cada artículo es canónico de sí mismo (sección 15); solo
    // se sobreescribe si el editor definió explícitamente otra URL canónica
    // (ej. republicación de contenido originado en otro sitio).
    alternates: { canonical: publication.canonicalUrl || `/publicaciones/${slug}` },
    robots: robotsWithLargePreview(publication.robots),
    openGraph: {
      title,
      description,
      type: "article",
      images: shareImage ? [shareImage] : undefined,
      publishedTime: publication.publishedAt ?? undefined,
      siteName: settings.name,
    },
  };
}

/** Todas las fotos de la publicación (Google elige la proporción que necesita); si no hay, la de compartir. */
function jsonLdImages(publication: Publication): string[] | undefined {
  const photos = publication.images.map(contentImageUrl).filter((url): url is string => Boolean(url));
  const fallback = shareImageUrl(publication);
  return photos.length > 0 ? photos : fallback ? [fallback] : undefined;
}

function publicationJsonLd(publication: Publication, category: Category | null, siteName: string) {
  const url = publication.canonicalUrl || `${SITE_URL}/publicaciones/${publication.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: publication.seoTitle || publication.title,
    description: publication.metaDescription || publication.excerpt || undefined,
    image: jsonLdImages(publication),
    datePublished: publication.publishedAt ?? undefined,
    dateModified: publication.updatedAt ?? publication.publishedAt ?? undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: category?.name,
    publisher: {
      "@type": "Organization",
      name: siteName,
    },
  };
}

function breadcrumbJsonLd(publication: Publication, category: Category | null) {
  const items = [
    { name: "Inicio", url: SITE_URL },
    ...(category ? [{ name: category.name, url: `${SITE_URL}/categorias/${category.slug}` }] : []),
    { name: publication.title, url: `${SITE_URL}/publicaciones/${publication.slug}` },
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

export default async function PublicationPage(props: PageProps<"/publicaciones/[slug]">) {
  const { slug } = await props.params;
  const publication = await loadPublication(slug);

  const [category, settings, relatedPage] = await Promise.all([
    getCategoryById(publication.categoryId).catch(() => null),
    getPlatformSettings(),
    getRelatedWithFallback({ excludeType: "PUBLICATION", excludeId: publication.id, categoryId: publication.categoryId, size: MORE_SIZE }),
  ]);
  const hasMedia = publication.images.length > 0 || publication.videos.length > 0;
  const moreItems = [...relatedPage.related, ...relatedPage.more].map(fromFeedItem);
  // Texto largo: el primer relacionado va a mitad del texto (y sale de «Más como esto» para no repetirse).
  const halves = moreItems.length > 0 ? splitBodyInHalf(publication.body) : null;
  const inline = halves ? moreItems[0] : null;

  return (
    <>
      <VideoJsonLd
        videos={publication.videos}
        fallbackTitle={publication.title}
        description={publication.metaDescription || publication.excerpt}
        uploadDate={publication.publishedAt}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(publicationJsonLd(publication, category, settings.name)).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(publication, category)).replace(/</g, "\\u003c"),
        }}
      />

      <PostView
        variant="text"
        brand={{ name: settings.name, logoUrl: settings.logoUrl ?? null }}
        typeLabel={KIND_LABEL.publicacion}
        categoryName={category?.name}
        time={updatedTimeFor(headerTimeFor({ kind: "publicacion", sortDate: publication.publishedAt ?? "" }), publication.updatedAt)}
        title={publication.title}
        // Texto largo: sin fotos ni videos no hace falta el bloque de marca, el título ya encabeza.
        media={hasMedia ? <PostDetailMedia images={publication.images} videos={publication.videos} title={publication.title} aspect="aspect-video" /> : null}
        excerpt={publication.excerpt}
        body={
          <>
            {halves && inline ? (
              <>
                <div className={PROSE} dangerouslySetInnerHTML={{ __html: halves[0] }} />
                <InlineRelated item={inline} />
                <div className={PROSE} dangerouslySetInnerHTML={{ __html: halves[1] }} />
              </>
            ) : (
              <div className={PROSE} dangerouslySetInnerHTML={{ __html: publication.body }} />
            )}
            <WhatsAppFollow channelUrl={settings.whatsappChannelUrl} siteName={settings.name} />
          </>
        }
        actions={<><ViewBeacon type="PUBLICATION" id={publication.id} /><LikeShareBar contentType="publications" slug={publication.slug} initialLikeCount={publication.likeCount} title={publication.title} /></>}
        ad={<AdBlock position="article" section="PUBLICATION" categoryId={publication.categoryId} layout="band" count={2} />}
        more={inline ? moreItems.slice(1) : moreItems}
      />
    </>
  );
}
