import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/auth";
import { AdminApiError, getAdminArticle, listActiveCategoriesFresh, listAdminImages } from "@/lib/api/admin-client";
import { getCategoryById, getPlatformSettings } from "@/lib/api/client";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { ArticleComposer } from "@/components/admin/article-composer";
import { AdminPageHeader } from "@/components/admin/ui";
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

  const [activeCategories, allImages, settings] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken),
    getPlatformSettings(),
  ]);
  const categories = await resolveCategories(activeCategories, article.categoryId);
  const permissions = computePublicationPermissions(article, user, "articles");

  return (
    <div className="space-y-6">
      <AdminPageHeader title={article.title} />
      <ArticleComposer
        article={article}
        categories={categories}
        allImages={allImages}
        permissions={permissions}
        siteName={settings.name}
      />
    </div>
  );
}
