import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/admin/access-denied";
import { requireAdminUser } from "@/lib/admin/auth";
import { getAdminGallery } from "@/lib/api/admin/content";
import { AdminApiError } from "@/lib/api/admin/http";
import { listAdminImages } from "@/lib/api/admin/media";
import { listActiveCategoriesFresh } from "@/lib/api/admin/taxonomy";
import { getCategoryById, getPlatformSettings } from "@/lib/api/client";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { GalleryComposer } from "@/components/admin/gallery-composer";
import { AdminPageHeader } from "@/components/admin/ui";
import type { Category } from "@/lib/api/types";
import { orNull } from "@/lib/server-log";

export const metadata: Metadata = {
  title: "Editar galería",
  robots: "noindex,nofollow",
};

/** La categoría de la galería puede haberse desactivado desde que se asignó; igual debe verse en el selector. */
async function resolveCategories(activeCategories: Category[], categoryId: string): Promise<Category[]> {
  if (activeCategories.some((c) => c.id === categoryId)) return activeCategories;
  const current = await getCategoryById(categoryId).catch(orNull("admin.galeria.tema"));
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
      return <AccessDenied />;
    }
    throw error;
  }

  const [activeCategories, allImages, settings] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken, "CONTENT"),
    getPlatformSettings(),
  ]);
  const categories = await resolveCategories(activeCategories, gallery.categoryId);
  const permissions = computePublicationPermissions(gallery, user, "galleries");

  return (
    <div className="space-y-6">
      <AdminPageHeader title={gallery.title} back={{ href: "/admin/galerias", label: "Galerías" }} />
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
