import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/auth";
import { AdminApiError, getAdminArticle, listActiveCategoriesFresh, listAdminImages } from "@/lib/api/admin-client";
import { getCategoryById, listAllTags } from "@/lib/api/client";
import { computeArticlePermissions } from "@/lib/admin/article-permissions";
import { ArticleForm } from "@/components/admin/article-form";
import type { Category } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Editar publicación",
  robots: "noindex,nofollow",
};

/** La categoría del artículo puede haberse desactivado desde que se asignó; igual debe verse en el selector. */
async function resolveCategories(activeCategories: Category[], categoryId: string): Promise<Category[]> {
  if (activeCategories.some((c) => c.id === categoryId)) return activeCategories;
  const current = await getCategoryById(categoryId).catch(() => null);
  return current ? [current, ...activeCategories] : activeCategories;
}

export default async function EditArticlePage(props: PageProps<"/admin/publicaciones/[id]">) {
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
        <p className="text-sm text-muted">No tienes acceso para ver esta publicación (pertenece a otro autor).</p>
      );
    }
    throw error;
  }

  const [activeCategories, allTags, allImages] = await Promise.all([
    listActiveCategoriesFresh(),
    listAllTags(),
    listAdminImages(accessToken),
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
          initialTagNames={tagNames}
          permissions={permissions}
        />
      </div>
    </div>
  );
}
