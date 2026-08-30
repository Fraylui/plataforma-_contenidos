import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/auth";
import { AdminApiError, getAdminArticle, listActiveCategoriesFresh, listAdminImages } from "@/lib/api/admin-client";
import { getCategoryById, getGeographyUnitById, listAllTags } from "@/lib/api/client";
import { computeArticlePermissions } from "@/lib/admin/article-permissions";
import { ArticleForm } from "@/components/admin/article-form";
import type { Category, GeographicUnit } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Editar publicación",
  robots: "noindex,nofollow",
};

/** Camino PAIS -> ... -> unidad seleccionada, para precargar el selector en cascada. */
async function resolveGeographyChain(geographyId: string | null): Promise<GeographicUnit[]> {
  if (!geographyId) return [];
  const chain: GeographicUnit[] = [];
  let current: GeographicUnit | null = await getGeographyUnitById(geographyId).catch(() => null);
  while (current) {
    chain.unshift(current);
    current = current.parentId ? await getGeographyUnitById(current.parentId).catch(() => null) : null;
  }
  return chain;
}

/** La categoría del artículo puede haberse desactivado desde que se asignó; igual debe verse en el selector. */
async function resolveCategories(activeCategories: Category[], categoryId: string): Promise<Category[]> {
  if (activeCategories.some((c) => c.id === categoryId)) return activeCategories;
  const current = await getCategoryById(categoryId).catch(() => null);
  return current ? [current, ...activeCategories] : activeCategories;
}

export default async function EditArticlePage(props: PageProps<"/admin/articulos/[id]">) {
  const { id } = await props.params;
  const { user, accessToken } = await requireAdminUser();

  let article;
  try {
    article = await getAdminArticle(accessToken, id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) {
      notFound();
    }
    if (error instanceof AdminApiError && error.status === 403) {
      return (
        <p className="text-sm text-muted">No tienes acceso para ver este artículo (pertenece a otro autor).</p>
      );
    }
    throw error;
  }

  const [activeCategories, allTags, allImages, geographyChain] = await Promise.all([
    listActiveCategoriesFresh(),
    listAllTags(),
    listAdminImages(accessToken),
    resolveGeographyChain(article.geographyId),
  ]);
  const categories = await resolveCategories(activeCategories, article.categoryId);
  const tagNames = allTags.filter((tag) => article.tagIds.includes(tag.id)).map((tag) => tag.name);
  const permissions = computeArticlePermissions(article, user);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{article.title}</h1>
      <div className="mt-6">
        <ArticleForm
          mode="edit"
          article={article}
          categories={categories}
          allImages={allImages}
          initialGeographyChain={geographyChain}
          initialTagNames={tagNames}
          permissions={permissions}
        />
      </div>
    </div>
  );
}
