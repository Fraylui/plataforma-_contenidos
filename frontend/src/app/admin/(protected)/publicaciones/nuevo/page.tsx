import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { listActiveCategoriesFresh, listAdminImages } from "@/lib/api/admin-client";
import { getPlatformSettings } from "@/lib/api/client";
import { AdminPageHeader } from "@/components/admin/ui";
import { ArticleComposer } from "@/components/admin/article-composer";

export const metadata: Metadata = {
  title: "Nueva publicación",
  robots: "noindex,nofollow",
};

export default async function NewArticlePage() {
  const { accessToken, user } = await requireAdminUser();
  const [categories, allImages, settings] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken),
    getPlatformSettings(),
  ]);
  // Lo nuevo es un borrador propio: mismos permisos que tendrá al guardarse.
  const permissions = computePublicationPermissions({ status: "DRAFT", authorId: user.id }, user, "articles");

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Nueva publicación" />
      <ArticleComposer categories={categories} allImages={allImages} permissions={permissions} siteName={settings.name} />
    </div>
  );
}
