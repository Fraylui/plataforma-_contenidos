import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/auth";
import { AdminApiError, getAdminGallery, listActiveCategoriesFresh, listAdminImages } from "@/lib/api/admin-client";
import { getCategoryById, getPlatformSettings } from "@/lib/api/client";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { GalleryComposer } from "@/components/admin/gallery-composer";
import { AdminPageHeader } from "@/components/admin/ui";
import type { Category } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Editar galería",
  robots: "noindex,nofollow",
};

/** La categoría de la galería puede haberse desactivado desde que se asignó; igual debe verse en el selector. */
async function resolveCategories(activeCategories: Category[], categoryId: string): Promise<Category[]> {
  if (activeCategories.some((c) => c.id === categoryId)) return activeCategories;
  const current = await getCategoryById(categoryId).catch(() => null);
  return current ? [current, ...activeCategories] : activeCategories;
}

export default async function EditGalleryPage(props: PageProps<"/admin/galerias/[id]">) {
  const { id } = await props.params;
  const { user, accessToken } = await requireAdminUser();

  let gallery;
  try {
    gallery = await getAdminGallery(accessToken, id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) {
      notFound();
    }
    if (error instanceof AdminApiError && error.status === 403) {
      return <p className="text-sm text-muted">No tienes acceso para ver esta galería (pertenece a otro autor).</p>;
    }
    throw error;
  }

  const [activeCategories, allImages, settings] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken),
    getPlatformSettings(),
  ]);
  const categories = await resolveCategories(activeCategories, gallery.categoryId);
  const permissions = computePublicationPermissions(gallery, user, "galleries");

  return (
    <div className="space-y-6">
      <AdminPageHeader title={gallery.title} />
      <GalleryComposer
        gallery={gallery}
        categories={categories}
        allImages={allImages}
        permissions={permissions}
        siteName={settings.name}
      />
    </div>
  );
}
