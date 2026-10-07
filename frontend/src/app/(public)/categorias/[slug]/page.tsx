import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/api/client";
import { FeedScreen } from "@/components/feed/feed-screen";

export async function generateMetadata(props: PageProps<"/categorias/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description || `Publicaciones, lugares y más de ${category.name}.`,
    // Sin esto hereda el canonical "/" del layout raíz (bug real hallado con
    // Lighthouse/lhci: SEO le decía a los buscadores que esta página era
    // duplicado del home).
    alternates: { canonical: `/categorias/${slug}` },
  };
}

/**
 * Tema = el feed del inicio filtrado por tema (incluye sus subtemas), con su
 * círculo activo y un encabezado con nombre y descripción, como la página
 * de un hashtag en Instagram. Un subtema marca el círculo de su tema raíz
 * (los círculos son solo temas raíz).
 */
export default async function CategoryPage(props: PageProps<"/categorias/[slug]">) {
  const { slug } = await props.params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <FeedScreen
      heading={category.name}
      intro={{ title: category.name, description: category.description }}
      filter={{ categoryId: category.id }}
      // Ningún chip de tipo activo: el filtro de esta pantalla es el tema.
      activePath={`/categorias/${slug}`}
      activeCategoryId={category.parentId ?? category.id}
      adSection="HOME"
      emptyMessage={`Todavía no hay contenido en ${category.name}.`}
    />
  );
}
