import type { Metadata } from "next";
import { FeedScreen } from "@/components/feed/feed-screen";

const BASE_PATH = "/celebraciones";

export const metadata: Metadata = {
  title: "Celebraciones",
  description: "Fiestas patrias, aniversarios y fechas que celebramos cada año, en orden desde hoy.",
  // Sin esto hereda el canonical "/" del layout raíz (bug real hallado con
  // Lighthouse/lhci: SEO le decía a los buscadores que esta página era
  // duplicado del home).
  alternates: { canonical: BASE_PATH },
};

/**
 * Celebraciones: el archivo (modelo Google, sin pestaña propia): las fechas que vienen
 * (las que se repiten cada año y las únicas) por la próxima vez que tocan,
 * en el mismo feed del inicio.
 */
export default function CelebrationsPage() {
  return (
    <FeedScreen
      heading="Celebraciones"
      filter={{ type: "CELEBRATION", sort: "upcoming" }}
      activePath={BASE_PATH}
      adSection="CELEBRATION"
      emptyMessage="No hay celebraciones próximas por ahora."
    />
  );
}
