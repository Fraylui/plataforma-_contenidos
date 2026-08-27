import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/auth";
import { AdminApiError, getAdminGallery, listActiveCategoriesFresh, listAdminImages } from "@/lib/api/admin-client";
import { getCategoryById, getGeographyUnitById } from "@/lib/api/client";
import { computeGalleryPermissions } from "@/lib/admin/gallery-permissions";
import { GalleryForm } from "@/components/admin/gallery-form";
import type { Category, GeographicUnit } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Editar galería",
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

  const [activeCategories, allImages, geographyChain] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken),
    resolveGeographyChain(gallery.geographyId),
  ]);
  const categories = await resolveCategories(activeCategories, gallery.categoryId);
  const permissions = computeGalleryPermissions(gallery, user);

  return (
    <div>
      <h1 className="font-serif text-2xl font-medium text-foreground">{gallery.title}</h1>
      <div className="mt-6">
        <GalleryForm
          mode="edit"
          gallery={gallery}
          categories={categories}
          allImages={allImages}
          initialGeographyChain={geographyChain}
          permissions={permissions}
        />
      </div>
    </div>
  );
}
