import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listActiveCategoriesFresh, listAdminImages, listPlaceOptions } from "@/lib/api/admin-client";
import { EventComposer } from "@/components/admin/event-composer";
import { AdminPageHeader } from "@/components/admin/ui";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { getPlatformSettings } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "Nueva celebración",
  robots: "noindex,nofollow",
};

export default async function NewEventPage() {
  const { accessToken, user } = await requireAdminUser();
  const [categories, allImages, places, settings] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken),
    listPlaceOptions(accessToken),
    getPlatformSettings(),
  ]);

  // Lo nuevo es un borrador propio: mismos permisos que tendrá al guardarse.
  const permissions = computePublicationPermissions({ status: "DRAFT" }, user, "events");

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Nueva celebración" back={{ href: "/admin/eventos", label: "Celebraciones" }} />
      <EventComposer categories={categories} places={places} allImages={allImages} permissions={permissions} siteName={settings.name} homeCountry={settings.homeCountry} />
    </div>
  );
}
