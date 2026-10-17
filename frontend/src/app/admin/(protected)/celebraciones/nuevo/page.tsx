import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listActiveCategoriesFresh, listAdminImages, listPlaceOptions } from "@/lib/api/admin-client";
import { CelebrationComposer } from "@/components/admin/celebration-composer";
import { AdminPageHeader } from "@/components/admin/ui";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { getPlatformSettings } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "Nueva celebración",
  robots: "noindex,nofollow",
};

export default async function NewCelebrationPage() {
  const { accessToken, user } = await requireAdminUser();
  const [categories, allImages, places, settings] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken),
    listPlaceOptions(accessToken),
    getPlatformSettings(),
  ]);

  // Lo nuevo es un borrador propio: mismos permisos que tendrá al guardarse.
  const permissions = computePublicationPermissions({ status: "DRAFT" }, user, "celebrations");

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Nueva celebración" back={{ href: "/admin/celebraciones", label: "Celebraciones" }} />
      <CelebrationComposer categories={categories} places={places} allImages={allImages} permissions={permissions} siteName={settings.name} homeCountry={settings.homeCountry} />
    </div>
  );
}
