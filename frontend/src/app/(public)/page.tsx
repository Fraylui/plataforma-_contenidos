import { FeedScreen } from "@/components/feed/feed-screen";
import { getPlatformSettings } from "@/lib/api/client";
import { SITE_URL } from "@/lib/site-url";
import { officialSocialLinks } from "@/lib/social-links";

/**
 * Inicio = feed estilo Instagram (diseño 2026-10-06): círculos de temas,
 * chips de tipo y publicaciones de una columna con scroll infinito; en
 * escritorio ancho, columna derecha con próximos eventos, lo más gustado y
 * un anuncio (ver FeedScreen, la misma pantalla de secciones y temas).
 */
export default async function Home() {
  const settings = await getPlatformSettings();
  // Nombre del sitio y de quien lo publica para Google (sale el nombre, no la dirección, en los resultados).
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "WebSite", name: settings.name, url: SITE_URL, inLanguage: "es-PE" },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: settings.name,
      url: SITE_URL,
      ...(settings.logoUrl ? { logo: settings.logoUrl.startsWith("/") ? `${SITE_URL}${settings.logoUrl}` : settings.logoUrl } : {}),
      ...(officialSocialLinks(settings).length > 0 ? { sameAs: officialSocialLinks(settings).map((s) => s.url) } : {}),
    },
  ];
  // Único <h1>, fuera de pantalla: la marca ya se ve en la navegación.
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <FeedScreen heading={settings.name} filter={{}} activePath="/" adSection="HOME" />
    </>
  );
}
