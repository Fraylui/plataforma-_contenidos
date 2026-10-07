import type { Metadata } from "next";
import { FeedScreen } from "@/components/feed/feed-screen";

const BASE_PATH = "/directorio";

export const metadata: Metadata = {
  title: "Directorio",
  description: "Restaurantes, hoteles y servicios locales.",
  // Sin esto hereda el canonical "/" del layout raíz (bug real hallado con
  // Lighthouse/lhci: SEO le decía a los buscadores que esta página era
  // duplicado del home).
  alternates: { canonical: BASE_PATH },
};

/**
 * Directorio: el mismo feed del inicio filtrado por tipo (chip activo), como
 * filtrar en Instagram — sin portada de sección ni desplegables. Las URLs
 * viejas con ?page= siguen respondiendo (canonical a la sección).
 */
export default function DirectoryPage() {
  return (
    <FeedScreen
      heading="Directorio"
      filter={{ type: "BUSINESS" }}
      activePath={BASE_PATH}
      adSection="BUSINESS"
      emptyMessage="Todavía no hay negocios en el directorio."
    />
  );
}
