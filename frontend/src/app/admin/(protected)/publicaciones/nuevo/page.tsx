import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { listAdminImages } from "@/lib/api/admin/media";
import { listActiveCategoriesFresh } from "@/lib/api/admin/taxonomy";
import { getPlatformSettings } from "@/lib/api/client";
import { AdminPageHeader } from "@/components/admin/ui";
import { PublicationComposer } from "@/components/admin/publication-composer";
import { TemplatePicker } from "@/components/admin/template-picker";
import { findTemplate } from "@/lib/admin/publication-templates";

export const metadata: Metadata = {
  title: "Nueva publicación",
  robots: "noindex,nofollow",
};

export default async function NewPublicationPage(props: PageProps<"/admin/publicaciones/nuevo">) {
  const template = findTemplate((await props.searchParams).plantilla);
  const { accessToken, user } = await requireAdminUser();
  const [categories, allImages, settings] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken, "CONTENT"),
    getPlatformSettings(),
  ]);
  // Lo nuevo es un borrador propio: mismos permisos que tendrá al guardarse.
  const permissions = computePublicationPermissions({ status: "DRAFT" }, user, "publications");

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Nueva publicación" back={{ href: "/admin/publicaciones", label: "Publicaciones" }} />
      <TemplatePicker selected={template?.key} />
      {/* key: al cambiar de plantilla el compositor arranca de nuevo con ese texto. */}
      <PublicationComposer
        key={template?.key ?? "blanco"}
        categories={categories}
        allImages={allImages}
        permissions={permissions}
        siteName={settings.name}
        template={template}
      />
    </div>
  );
}
