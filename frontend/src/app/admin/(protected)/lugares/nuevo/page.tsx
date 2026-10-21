import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listActiveCategoriesFresh, listAdminImages, listAdminPlaces } from "@/lib/api/admin-client";
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
  const [categories, allImages, settings, recentPlaces] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken, "CONTENT"),
    getPlatformSettings(),
    // Solo para centrar el mapa: si falla, el mapa abre en el mundo como antes.
    listAdminPlaces(accessToken, { page: 0 }).catch(() => null),
  ]);
  // Lo más nuevo primero (orden por defecto): el mapa empieza donde fue el último lugar con pin.
  const lastPinned = recentPlaces?.items.find((place) => place.latitude != null && place.longitude != null);
  const mapStartAt: [number, number] | null = lastPinned ? [lastPinned.latitude!, lastPinned.longitude!] : null;

  // Lo nuevo es un borrador propio: mismos permisos que tendrá al guardarse.
  const permissions = computePublicationPermissions({ status: "DRAFT" }, user, "places");

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Nuevo lugar" back={{ href: "/admin/lugares", label: "Lugares" }} />
      <PlaceComposer categories={categories} allImages={allImages} permissions={permissions} siteName={settings.name} mapStartAt={mapStartAt} />
    </div>
  );
}
