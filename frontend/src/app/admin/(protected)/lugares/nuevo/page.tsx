import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listActiveCategoriesFresh, listAdminImages } from "@/lib/api/admin-client";
import { PlaceComposer } from "@/components/admin/place-composer";
import { AdminPageHeader } from "@/components/admin/ui";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { getPlatformSettings } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "Nuevo lugar",
  robots: "noindex,nofollow",
};

export default async function NewPlacePage() {
  const { accessToken, user } = await requireAdminUser();
  const [categories, allImages, settings] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken),
    getPlatformSettings(),
  ]);

  // Lo nuevo es un borrador propio: mismos permisos que tendrá al guardarse.
  const permissions = computePublicationPermissions({ status: "DRAFT", authorId: user.id }, user, "places");

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Nuevo lugar" />
      <PlaceComposer categories={categories} allImages={allImages} permissions={permissions} siteName={settings.name} />
    </div>
  );
}
