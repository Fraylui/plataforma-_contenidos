import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/admin/access-denied";
import { requireAdminUser } from "@/lib/admin/auth";
import { getAdminPublication } from "@/lib/api/admin/content";
import { AdminApiError } from "@/lib/api/admin/http";
import { listAdminImages } from "@/lib/api/admin/media";
import { listActiveCategoriesFresh } from "@/lib/api/admin/taxonomy";
import { getCategoryById, getPlatformSettings } from "@/lib/api/client";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { PublicationComposer } from "@/components/admin/publication-composer";
import { AdminPageHeader } from "@/components/admin/ui";
import type { Category } from "@/lib/api/types";
import { orNull } from "@/lib/server-log";

export const metadata: Metadata = {
  title: "Editar publicación",
  robots: "noindex,nofollow",
};

/** La categoría del artículo puede haberse desactivado desde que se asignó; igual debe verse en el selector. */
async function resolveCategories(activeCategories: Category[], categoryId: string): Promise<Category[]> {
  if (activeCategories.some((c) => c.id === categoryId)) return activeCategories;
  const current = await getCategoryById(categoryId).catch(orNull("admin.publicacion.tema"));
  return current ? [current, ...activeCategories] : activeCategories;
}

export default async function EditPublicationPage(props: PageProps<"/admin/publicaciones/[id]">) {
  const { id } = await props.params;
  const { user, accessToken } = await requireAdminUser();

  let publication;
  try {
    publication = await getAdminPublication(accessToken, id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) {
      notFound();
    }
    if (error instanceof AdminApiError && error.status === 403) {
      return <AccessDenied />;
    }
    throw error;
  }

  const [activeCategories, allImages, settings] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken, "CONTENT"),
    getPlatformSettings(),
  ]);
  const categories = await resolveCategories(activeCategories, publication.categoryId);
  const permissions = computePublicationPermissions(publication, user, "publications");

  return (
    <div className="space-y-6">
      <AdminPageHeader title={publication.title} back={{ href: "/admin/publicaciones", label: "Publicaciones" }} />
      <PublicationComposer
        publication={publication}
        categories={categories}
        allImages={allImages}
        permissions={permissions}
        siteName={settings.name}
      />
    </div>
  );
}
