import type { Metadata } from "next";
import { FeedScreen } from "@/components/feed/feed-screen";

const BASE_PATH = "/lugares";

export const metadata: Metadata = {
  title: "Lugares",
  description: "Lugares para visitar: historia, fotos y cómo llegar.",
  // Sin esto hereda el canonical "/" del layout raíz (bug real hallado con
  // Lighthouse/lhci: SEO le decía a los buscadores que esta página era
  // duplicado del home).
  alternates: { canonical: BASE_PATH },
};

/**
 * Lugares: el mismo feed del inicio filtrado por tipo (chip activo), como
 * filtrar en Instagram — sin portada de sección ni desplegables. Las URLs
 * viejas con ?page= siguen respondiendo (canonical a la sección).
 */
export default function PlacesPage() {
  return (
    <FeedScreen
      heading="Lugares"
      filter={{ type: "PLACE" }}
      activePath={BASE_PATH}
      adSection="PLACE"
      emptyMessage="Todavía no hay lugares."
    />
  );
}
