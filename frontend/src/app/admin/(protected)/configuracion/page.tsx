import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { getAdminPlatformSettings } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { PlatformSettingsForm } from "@/components/admin/platform-settings-form";
import { AdminPageHeader } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Configuración del sitio",
  robots: "noindex,nofollow",
};

export default async function AdminConfigurationPage() {
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => getAdminPlatformSettings(accessToken));
  if ("denied" in result) return <AccessDenied />;

  return (
    <div>
      <AdminPageHeader
        title="Configuración del sitio"
        description="Nombre, logo, apariencia, cómo se ve en Google y al compartir, contacto y publicidad. Los cambios se ven en el sitio al guardar."
      />
      <div className="mt-6">
        <PlatformSettingsForm settings={result.data} />
      </div>
    </div>
  );
}
