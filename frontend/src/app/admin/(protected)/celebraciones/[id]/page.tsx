import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/admin/access-denied";
import { requireAdminUser } from "@/lib/admin/auth";
import {
  AdminApiError,
  getAdminCelebration,
  listActiveCategoriesFresh,
  listAdminImages,
  listPlaceOptions,
} from "@/lib/api/admin-client";
import { getCategoryById, getPlatformSettings } from "@/lib/api/client";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { CelebrationComposer } from "@/components/admin/celebration-composer";
import { AdminPageHeader } from "@/components/admin/ui";
import type { Category } from "@/lib/api/types";
import { orNull } from "@/lib/server-log";

export const metadata: Metadata = {
  title: "Editar celebración",
  robots: "noindex,nofollow",
};

/** La categoría del evento puede haberse desactivado desde que se asignó; igual debe verse en el selector. */
async function resolveCategories(activeCategories: Category[], categoryId: string): Promise<Category[]> {
  if (activeCategories.some((c) => c.id === categoryId)) return activeCategories;
  const current = await getCategoryById(categoryId).catch(orNull("admin.celebracion.tema"));
  return current ? [current, ...activeCategories] : activeCategories;
}

export default async function EditCelebrationPage(props: PageProps<"/admin/celebraciones/[id]">) {
  const { id } = await props.params;
  const { user, accessToken } = await requireAdminUser();

  let celebration;
  try {
    celebration = await getAdminCelebration(accessToken, id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) {
      notFound();
    }
    if (error instanceof AdminApiError && error.status === 403) {
      return <AccessDenied />;
    }
    throw error;
  }

  const [activeCategories, allImages, places, settings] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken, "CONTENT"),
    listPlaceOptions(accessToken),
    getPlatformSettings(),
  ]);
  const categories = await resolveCategories(activeCategories, celebration.categoryId);
  const permissions = computePublicationPermissions(celebration, user, "celebrations");

  return (
    <div className="space-y-6">
      <AdminPageHeader title={celebration.title} back={{ href: "/admin/celebraciones", label: "Celebraciones" }} />
      <CelebrationComposer
        celebration={celebration}
        categories={categories} places={places}
        allImages={allImages}
        permissions={permissions}
        siteName={settings.name}
        homeCountry={settings.homeCountry}
      />
    </div>
  );
}
