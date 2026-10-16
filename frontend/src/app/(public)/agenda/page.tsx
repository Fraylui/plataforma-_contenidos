import type { Metadata } from "next";
import { FeedScreen } from "@/components/feed/feed-screen";

const BASE_PATH = "/agenda";

export const metadata: Metadata = {
  title: "Agenda",
  description: "Las fechas que vienen: fiestas patrias, aniversarios, celebraciones y fenómenos, en orden.",
  // Sin esto hereda el canonical "/" del layout raíz (bug real hallado con
  // Lighthouse/lhci: SEO le decía a los buscadores que esta página era
  // duplicado del home).
  alternates: { canonical: BASE_PATH },
};

/**
 * Agenda (pestaña de la barra inferior y del riel): las fechas que vienen
 * (las que se repiten cada año y las únicas) por la próxima vez que tocan,
 * en el mismo feed del inicio.
 */
export default function AgendaPage() {
  return (
    <FeedScreen
      heading="Agenda"
      filter={{ type: "EVENT", sort: "upcoming" }}
      activePath={BASE_PATH}
      adSection="EVENT"
      emptyMessage="No hay fechas próximas por ahora."
    />
  );
}
