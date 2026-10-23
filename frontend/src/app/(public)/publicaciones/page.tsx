import type { Metadata } from "next";
import { FeedScreen } from "@/components/feed/feed-screen";

const BASE_PATH = "/publicaciones";

export const metadata: Metadata = {
  title: "Publicaciones",
  description: "Todo lo publicado, lo más reciente primero.",
  // Sin esto hereda el canonical "/" del layout raíz (bug real hallado con
  // Lighthouse/lhci: SEO le decía a los buscadores que esta página era
  // duplicado del home).
  alternates: { canonical: BASE_PATH },
};

/**
 * Publicaciones: el mismo feed del inicio filtrado por tipo (chip activo), como
 * filtrar en Instagram — sin portada de sección ni desplegables. Las URLs
 * viejas con ?page= siguen respondiendo (canonical a la sección).
 */
export default function PublicationsPage() {
  return (
    <FeedScreen
      heading="Publicaciones"
      filter={{ type: "PUBLICATION" }}
      activePath={BASE_PATH}
      adSection="PUBLICATION"
      emptyMessage="Todavía no hay publicaciones."
    />
  );
}
