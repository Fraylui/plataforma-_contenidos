import { getFeed, getFeedTopics, getPlatformSettings, getPrimaryNavVisibility, listActiveCategories } from "@/lib/api/client";
import { imageUrl } from "@/lib/image-url";
import { CookieConsentBanner } from "@/components/legal/cookie-consent-banner";
import { AdsenseLoader } from "@/components/legal/adsense-loader";
import { AnchorAdSlot } from "@/components/legal/anchor-ad-slot";
import { LeftRail } from "@/components/shell/left-rail";
import { countThisWeek } from "@/components/shell/agenda-count";
import { BottomTabBar } from "@/components/shell/bottom-tab-bar";
import { TopBar } from "@/components/shell/top-bar";

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
  const [settings, visibility, topics, categories, upcoming] = await Promise.all([
    getPlatformSettings(),
    getPrimaryNavVisibility(),
    getFeedTopics().catch(() => []),
    listActiveCategories(),
    // Contador de Agenda: los próximos por fecha; 10 alcanzan para mostrar "9+".
    getFeed({ type: "EVENT", sort: "upcoming", size: 10 }).catch(() => ({ items: [], hasMore: false })),
  ]);
  const categoryNames: Record<string, string> = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const topicLinks = topics.map((t) => ({
    categoryId: t.categoryId,
    name: t.name,
    slug: t.slug,
    coverUrl: t.coverImageId ? imageUrl(`/api/v1/images/${t.coverImageId}/file`) : t.coverImageUrl,
    hasNew: t.hasNew,
  }));
  const brand = { name: settings.name, logoUrl: settings.logoUrl ?? null };
  const showAgenda = Boolean(visibility["/eventos"]);
  const agendaCount = showAgenda ? countThisWeek(upcoming.items.map((e) => e.startsAt)) : 0;

  return (
    <div id="top" className="flex min-h-full bg-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-accent-fill focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-accent-foreground"
      >
        Saltar al contenido principal
      </a>
      <LeftRail
        brand={brand}
        showAgenda={showAgenda}
        sections={visibility}
        topics={topicLinks}
        agendaCount={agendaCount}
        categoryNames={categoryNames}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar brand={brand} />
        <main id="main-content" className="flex-1 pb-(--bottom-bar-h)">
          {children}
        </main>
      </div>
      <BottomTabBar showAgenda={showAgenda} />
      <AnchorAdSlot />
      <CookieConsentBanner adsenseEnabled={settings.adsenseEnabled} />
      {settings.adsenseEnabled && settings.adsenseClientId && (
        <AdsenseLoader clientId={settings.adsenseClientId} />
      )}
    </div>
  );
}
