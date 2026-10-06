import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryById, getPlatformSettings, getPublishedArticleBySlug, getRelatedWithFallback } from "@/lib/api/client";
import { NotFoundError } from "@/lib/api/client";
import { LikeShareBar } from "@/components/content/like-share-bar";
import { AdBlock } from "@/components/legal/ad-block";
import { PostView } from "@/components/post/post-view";
import { PostDetailMedia } from "@/components/post/post-detail-media";
import { headerTimeFor } from "@/components/post/post-header";
import { KIND_LABEL } from "@/lib/content-kind";
import { fromFeedItem } from "@/lib/home-items";
import { SITE_URL } from "@/lib/site-url";
import type { Article, Category } from "@/lib/api/types";
import { VideoJsonLd } from "@/components/seo/video-json-ld";

/** "Más como esto": 3 filas de la cuadrícula de 3. */
const MORE_SIZE = 9;

async function loadArticle(slug: string) {
  try {
    return await getPublishedArticleBySlug(slug);
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
  let article;
  try {
    article = await getPublishedArticleBySlug(slug);
  } catch {
    return {};
  }
  const settings = await getPlatformSettings();

  const title = article.seoTitle || article.title;
  const description = article.metaDescription || article.excerpt || undefined;

  return {
    title,
    description,
    // Por defecto, cada artículo es canónico de sí mismo (sección 15); solo
    // se sobreescribe si el editor definió explícitamente otra URL canónica
    // (ej. republicación de contenido originado en otro sitio).
    alternates: { canonical: article.canonicalUrl || `/publicaciones/${slug}` },
    robots: article.robots,
    openGraph: {
      title,
      description,
      type: "article",
      images: article.ogImageUrl ? [article.ogImageUrl] : undefined,
      publishedTime: article.publishedAt ?? undefined,
      siteName: settings.name,
    },
  };
}

function articleJsonLd(article: Article, category: Category | null, siteName: string) {
  const url = article.canonicalUrl || `${SITE_URL}/publicaciones/${article.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.seoTitle || article.title,
    description: article.metaDescription || article.excerpt || undefined,
    image: article.ogImageUrl ? [article.ogImageUrl] : undefined,
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.updatedAt ?? article.publishedAt ?? undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: category?.name,
    publisher: {
      "@type": "Organization",
      name: siteName,
    },
  };
}

function breadcrumbJsonLd(article: Article, category: Category | null) {
  const items = [
    { name: "Inicio", url: SITE_URL },
    ...(category ? [{ name: category.name, url: `${SITE_URL}/categorias/${category.slug}` }] : []),
    { name: article.title, url: `${SITE_URL}/publicaciones/${article.slug}` },
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

export default async function ArticlePage(props: PageProps<"/publicaciones/[slug]">) {
  const { slug } = await props.params;
  const article = await loadArticle(slug);

  const [category, settings, relatedPage] = await Promise.all([
    getCategoryById(article.categoryId).catch(() => null),
    getPlatformSettings(),
    getRelatedWithFallback({ excludeType: "ARTICLE", excludeId: article.id, categoryId: article.categoryId, size: MORE_SIZE }),
  ]);
  const hasMedia = article.images.length > 0 || article.videos.length > 0;

  return (
    <>
      <VideoJsonLd
        videos={article.videos}
        fallbackTitle={article.title}
        description={article.metaDescription || article.excerpt}
        uploadDate={article.publishedAt}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd(article, category, settings.name)).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(article, category)).replace(/</g, "\\u003c"),
        }}
      />

      <PostView
        variant="text"
        brand={{ name: settings.name, logoUrl: settings.logoUrl ?? null }}
        typeLabel={KIND_LABEL.publicacion}
        categoryName={category?.name}
        time={headerTimeFor({ kind: "publicacion", sortDate: article.publishedAt ?? "" })}
        title={article.title}
        // Texto largo: sin fotos ni videos no hace falta el bloque de marca, el título ya encabeza.
        media={hasMedia ? <PostDetailMedia images={article.images} videos={article.videos} title={article.title} aspect="aspect-video" /> : null}
        excerpt={article.excerpt}
        body={
          // article.body es HTML ya sanitizado en el backend (HtmlSanitizer, whitelist
          // de tags) antes de persistirse — nunca se renderiza HTML sin pasar por ahí.
          // Cita destacada con borde de acento; imágenes y subtítulos sin líneas ni
          // sombras (la separación es el espacio, como el resto del sitio).
          <div
            className="prose prose-theme sm:prose-lg max-w-none
              prose-headings:font-bold prose-headings:tracking-tight
              prose-h2:mt-10 prose-h2:text-2xl
              prose-h3:mt-8 prose-h3:text-xl
              prose-a:text-accent
              prose-blockquote:border-l-accent prose-blockquote:not-italic prose-blockquote:font-semibold
              prose-blockquote:text-xl prose-blockquote:leading-snug prose-blockquote:text-foreground
              prose-blockquote:before:content-none prose-blockquote:after:content-none
              prose-img:rounded-2xl"
            dangerouslySetInnerHTML={{ __html: article.body }}
          />
        }
        actions={<LikeShareBar contentType="articles" slug={article.slug} initialLikeCount={article.likeCount} title={article.title} />}
        ad={<AdBlock position="article" section="ARTICLE" categoryId={article.categoryId} layout="band" count={2} />}
        more={[...relatedPage.related, ...relatedPage.more].map(fromFeedItem)}
      />
    </>
  );
}
