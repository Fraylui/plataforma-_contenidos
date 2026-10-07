import type { Metadata } from "next";
import { FeedScreen } from "@/components/feed/feed-screen";

const BASE_PATH = "/eventos";

export const metadata: Metadata = {
  title: "Agenda",
  description: "Próximos eventos de la región, ordenados por fecha.",
  // Sin esto hereda el canonical "/" del layout raíz (bug real hallado con
  // Lighthouse/lhci: SEO le decía a los buscadores que esta página era
  // duplicado del home).
  alternates: { canonical: BASE_PATH },
};

/**
 * Agenda (pestaña de la barra inferior y del riel): los próximos eventos
 * por fecha de inicio, en el mismo feed del inicio. Conserva la URL
 * /eventos.
 */
export default function AgendaPage() {
  return (
    <FeedScreen
      heading="Agenda"
      filter={{ type: "EVENT", sort: "upcoming" }}
      activePath={BASE_PATH}
      adSection="EVENT"
      emptyMessage="No hay eventos próximos por ahora."
    />
  );
}
