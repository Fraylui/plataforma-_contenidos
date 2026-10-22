import { getFeedTopics, getPlatformSettings, getPrimaryNavVisibility, listActiveCategories } from "@/lib/api/client";
import { imageUrl } from "@/lib/image-url";
import { CookieConsentBanner } from "@/components/legal/cookie-consent-banner";
import { AdsenseLoader } from "@/components/legal/adsense-loader";
import { AnalyticsLoader } from "@/components/legal/analytics-loader";
import { officialSocialLinks } from "@/lib/social-links";
import { AnchorAdSlot } from "@/components/legal/anchor-ad-slot";
import { LeftRail } from "@/components/shell/left-rail";
import { BottomTabBar } from "@/components/shell/bottom-tab-bar";
import { TopBar } from "@/components/shell/top-bar";
import { orDefault } from "@/lib/server-log";

/**
 * Cascarón del sitio público, estilo app (diseño 2026-10-06): riel de
 * navegación a la izquierda en escritorio, barra de pestañas abajo en
 * celular, franja superior mínima con el buscador. Reemplaza al encabezado
 * de dos franjas, al menú ☰ y al pie de página de estilo diario (los
 * enlaces legales pasan al riel y a la hoja "Más").
 *
 * Separado del layout raíz (app/layout.tsx) para que /admin/* no lo herede.
 */
export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const [settings, visibility, topics, categories] = await Promise.all([
    getPlatformSettings(),
    getPrimaryNavVisibility(),
    getFeedTopics().catch(orDefault("sitio.temas", [])),
    listActiveCategories(),
  ]);
  const categoryNames: Record<string, string> = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const topicLinks = topics.map((t) => ({
    categoryId: t.categoryId,
    name: t.name,
    slug: t.slug,
    coverUrl: t.coverImageId ? imageUrl(`/api/v1/images/${t.coverImageId}/file`) : t.coverImageUrl,
    hasNew: t.hasNew,
  }));
  const brand = { name: settings.name, logoUrl: settings.logoUrl ?? null, logoDarkUrl: settings.logoDarkUrl };
  const social = officialSocialLinks(settings);

  return (
    <div id="top" className="flex min-h-dvh bg-canvas">
      {/* min-h-dvh (no min-h-full: el body no tiene alto fijo): una página corta no deja ver otro fondo debajo. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-accent-fill focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-foreground"
      >
        Saltar al contenido principal
      </a>
      <LeftRail
        brand={brand}
        sections={visibility}
        topics={topicLinks}
        categoryNames={categoryNames}
        social={social}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar brand={brand} />
        <main id="main-content" className="flex-1 pb-(--bottom-bar-h)">
          {children}
        </main>
      </div>
      <BottomTabBar brandName={settings.name} social={social} />
      <AnchorAdSlot />
      <CookieConsentBanner adsenseEnabled={settings.adsenseEnabled} />
      {settings.adsenseEnabled && settings.adsenseClientId && (
        <AdsenseLoader clientId={settings.adsenseClientId} />
      )}
      <AnalyticsLoader measurementId={settings.analyticsId} />
    </div>
  );
}
