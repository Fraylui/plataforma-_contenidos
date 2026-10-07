import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listActiveCategoriesFresh, listAdminImages } from "@/lib/api/admin-client";
import { GalleryComposer } from "@/components/admin/gallery-composer";
import { AdminPageHeader } from "@/components/admin/ui";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { getPlatformSettings } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "Nueva galería",
  robots: "noindex,nofollow",
};

export default async function NewGalleryPage() {
  const { accessToken, user } = await requireAdminUser();
  const [categories, allImages, settings] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken),
    getPlatformSettings(),
  ]);

  // Lo nuevo es un borrador propio: mismos permisos que tendrá al guardarse.
  const permissions = computePublicationPermissions({ status: "DRAFT", authorId: user.id }, user, "galleries");

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Nueva galería" />
      <GalleryComposer categories={categories} allImages={allImages} permissions={permissions} siteName={settings.name} />
    </div>
  );
}
