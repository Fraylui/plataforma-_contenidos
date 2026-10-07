import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/auth";
import {
  AdminApiError,
  getAdminBusiness,
  listActiveCategoriesFresh,
  listAdminImages,
  listPlaceOptions,
} from "@/lib/api/admin-client";
import { getCategoryById, getPlatformSettings } from "@/lib/api/client";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { BusinessComposer } from "@/components/admin/business-composer";
import { AdminPageHeader } from "@/components/admin/ui";
import type { Category } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Editar ficha de directorio",
  robots: "noindex,nofollow",
};

/** La categoría de la ficha puede haberse desactivado desde que se asignó; igual debe verse en el selector. */
async function resolveCategories(activeCategories: Category[], categoryId: string): Promise<Category[]> {
  if (activeCategories.some((c) => c.id === categoryId)) return activeCategories;
  const current = await getCategoryById(categoryId).catch(() => null);
  return current ? [current, ...activeCategories] : activeCategories;
}

export default async function EditBusinessPage(props: PageProps<"/admin/directorio/[id]">) {
  const { id } = await props.params;
  const { user, accessToken } = await requireAdminUser();

  let business;
  try {
    business = await getAdminBusiness(accessToken, id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) {
      notFound();
    }
    if (error instanceof AdminApiError && error.status === 403) {
      return <p className="text-sm text-muted">No tienes acceso para ver esta ficha (pertenece a otro autor).</p>;
    }
    throw error;
  }

  const [activeCategories, allImages, places, settings] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken),
    listPlaceOptions(accessToken),
    getPlatformSettings(),
  ]);
  const categories = await resolveCategories(activeCategories, business.categoryId);
  const permissions = computePublicationPermissions(business, user, "directory");

  return (
    <div className="space-y-6">
      <AdminPageHeader title={business.name} />
      <BusinessComposer
        business={business}
        categories={categories} places={places}
        allImages={allImages}
        permissions={permissions}
        siteName={settings.name}
      />
    </div>
  );
}
