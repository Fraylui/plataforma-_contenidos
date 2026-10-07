import { FeedScreen } from "@/components/feed/feed-screen";
import { getPlatformSettings } from "@/lib/api/client";

/**
 * Inicio = feed estilo Instagram (diseño 2026-10-06): círculos de temas,
 * chips de tipo y publicaciones de una columna con scroll infinito; en
 * escritorio ancho, columna derecha con próximos eventos, lo más gustado y
 * un anuncio (ver FeedScreen, la misma pantalla de secciones y temas).
 */
export default async function Home() {
  const settings = await getPlatformSettings();
  // Único <h1>, fuera de pantalla: la marca ya se ve en la navegación.
  return <FeedScreen heading={settings.name} filter={{}} activePath="/" adSection="HOME" />;
}
