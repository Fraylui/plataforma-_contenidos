import type { Metadata } from "next";
import { FeedScreen } from "@/components/feed/feed-screen";

const BASE_PATH = "/galerias";

export const metadata: Metadata = {
  title: "Galerías",
  description: "Colecciones de fotografías de la región.",
  // Sin esto hereda el canonical "/" del layout raíz (bug real hallado con
  // Lighthouse/lhci: SEO le decía a los buscadores que esta página era
  // duplicado del home).
  alternates: { canonical: BASE_PATH },
};

/**
 * Galerías: el mismo feed del inicio filtrado por tipo (chip activo), como
 * filtrar en Instagram — sin portada de sección ni desplegables. Las URLs
 * viejas con ?page= siguen respondiendo (canonical a la sección).
 */
export default function GalleriesPage() {
  return (
    <FeedScreen
      heading="Galerías"
      filter={{ type: "GALLERY" }}
      activePath={BASE_PATH}
      adSection="GALLERY"
      emptyMessage="Todavía no hay galerías."
    />
  );
}
