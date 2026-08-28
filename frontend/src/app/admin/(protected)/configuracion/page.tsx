import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { getAdminPlatformSettings } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { PlatformSettingsForm } from "@/components/admin/platform-settings-form";
import { AdminPageHeader } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Configuración de plataforma",
  robots: "noindex,nofollow",
};

export default async function AdminConfigurationPage() {
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => getAdminPlatformSettings(accessToken));
  if ("denied" in result) return <AccessDenied />;

  return (
    <div>
      <AdminPageHeader
        title="Configuración de plataforma"
        description="Identidad, apariencia, SEO por defecto, redes y contacto. Se aplica en todo el sitio sin redeploy (CONTEXTO.md sección 14)."
      />
      <div className="mt-6">
        <PlatformSettingsForm settings={result.data} />
      </div>
    </div>
  );
}
