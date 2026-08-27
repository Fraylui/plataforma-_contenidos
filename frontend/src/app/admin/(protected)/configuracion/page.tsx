import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { getAdminPlatformSettings } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { PlatformSettingsForm } from "@/components/admin/platform-settings-form";

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
      <h1 className="font-serif text-2xl font-medium text-foreground">Configuración de plataforma</h1>
      <p className="mt-1 text-sm text-muted">
        Identidad, apariencia, SEO por defecto, redes y contacto. Se aplica en todo el sitio sin redeploy
        (CONTEXTO.md sección 14).
      </p>
      <div className="mt-6">
        <PlatformSettingsForm settings={result.data} />
      </div>
    </div>
  );
}
