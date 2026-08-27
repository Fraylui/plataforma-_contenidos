import { getPlatformSettings } from "@/lib/api/client";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CookieConsentBanner } from "@/components/legal/cookie-consent-banner";
import { AdsenseLoader } from "@/components/legal/adsense-loader";

/**
 * Chrome del sitio público (header/footer/banner de cookies/AdSense) — a
 * propósito, separado del layout raíz (app/layout.tsx) para que /admin/*
 * no lo herede. Antes vivía en el layout raíz y se renderizaba encima del
 * propio shell del panel admin (sidebar + header de usuario), duplicando
 * navegación — reportado por el usuario al entrar al admin.
 */
export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const settings = await getPlatformSettings();

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <CookieConsentBanner adsenseEnabled={settings.adsenseEnabled} />
      {settings.adsenseEnabled && settings.adsenseClientId && (
        <AdsenseLoader clientId={settings.adsenseClientId} />
      )}
    </div>
  );
}
