import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/admin/access-denied";
import { requireAdminUser } from "@/lib/admin/auth";
import { getAdminPlace } from "@/lib/api/admin/content";
import { AdminApiError } from "@/lib/api/admin/http";
import { listAdminImages } from "@/lib/api/admin/media";
import { listActiveCategoriesFresh } from "@/lib/api/admin/taxonomy";
import { getCategoryById, getPlatformSettings } from "@/lib/api/client";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { PlaceComposer } from "@/components/admin/place-composer";
import { AdminPageHeader } from "@/components/admin/ui";
import { DuplicateButton } from "@/components/admin/duplicate-button";
import { duplicatePlaceAction } from "../actions";
import { AffiliateLinksEditor } from "@/components/admin/affiliate-links-editor";
import { listAffiliateLinks } from "@/lib/api/admin/affiliates";
import type { Category } from "@/lib/api/types";
import { orNull } from "@/lib/server-log";

export const metadata: Metadata = {
  title: "Editar lugar",
  robots: "noindex,nofollow",
};

/** La categoría del lugar puede haberse desactivado desde que se asignó; igual debe verse en el selector. */
async function resolveCategories(activeCategories: Category[], categoryId: string): Promise<Category[]> {
  if (activeCategories.some((c) => c.id === categoryId)) return activeCategories;
  const current = await getCategoryById(categoryId).catch(orNull("admin.lugar.tema"));
  return current ? [current, ...activeCategories] : activeCategories;
}

export default async function EditPlacePage(props: PageProps<"/admin/lugares/[id]">) {
  const { id } = await props.params;
  const { user, accessToken } = await requireAdminUser();

  let place;
  try {
    place = await getAdminPlace(accessToken, id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) {
      notFound();
    }
    if (error instanceof AdminApiError && error.status === 403) {
      return <AccessDenied />;
    }
    throw error;
  }

  const [activeCategories, allImages, settings, affiliateLinks] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken, "CONTENT"),
    getPlatformSettings(),
    listAffiliateLinks(accessToken, "PLACE", id),
  ]);
  const categories = await resolveCategories(activeCategories, place.categoryId);
  const permissions = computePublicationPermissions(place, user, "places");

  return (
    <div className="space-y-6">
      <AdminPageHeader title={place.name} back={{ href: "/admin/lugares", label: "Lugares" }} />
      <div className="-mt-4 flex justify-end">
        <DuplicateButton action={duplicatePlaceAction.bind(null, id)} />
      </div>
      <PlaceComposer
        place={place}
        categories={categories}
        allImages={allImages}
        permissions={permissions}
        siteName={settings.name}
      />
      <AffiliateLinksEditor type="PLACE" contentId={id} initialLinks={affiliateLinks} />
    </div>
  );
}
