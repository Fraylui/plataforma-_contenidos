import type { Metadata } from "next";
import { getPlatformSettings } from "@/lib/api/client";
import { LegalPageLayout, type LegalSection } from "@/components/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "Términos de Uso",
  robots: "index,follow",
};

const UPDATED_AT = "27 de agosto de 2026";

export default async function TermsOfUsePage() {
  const settings = await getPlatformSettings();
  const contact = settings.contactEmail || "el correo de contacto publicado en este sitio";

  const sections: LegalSection[] = [
    {
      id: "que-es",
      title: "Qué es este sitio",
      content: (
        <p>
          {settings.name} es una plataforma de contenidos: artículos, lugares y otros formatos que se van sumando,
          todos con revisión editorial antes de publicarse. Al navegar el sitio aceptás estos términos — hoy no hace
          falta registrarte ni pagar para leer nada.
        </p>
      ),
    },
    {
      id: "uso-permitido",
      title: "Uso permitido",
      content: (
        <p>
          Podés leer, compartir y enlazar el contenido libremente. No está permitido reproducirlo completo en otro
          sitio sin autorización, extraerlo de forma automatizada y masiva (scraping), ni usar el sitio para
          actividades ilegales.
        </p>
      ),
    },
    {
      id: "contenido-publicidad",
      title: "Contenido y publicidad",
      content: (
        <p>
          El contenido editorial y la publicidad se muestran diferenciados; lo patrocinado se marca como tal, nunca
          se presenta como nota independiente.{" "}
          {settings.adsenseEnabled
            ? "Este sitio muestra publicidad vía Google AdSense — ver la Política de Privacidad."
            : "Hoy el sitio no muestra publicidad de terceros."}
        </p>
      ),
    },
    {
      id: "propiedad-intelectual",
      title: "Propiedad intelectual",
      content: (
        <p>
          Los textos y fotografías originales son de {settings.name} o de sus autores, protegidos por derechos de
          autor. Los videos de YouTube embebidos siguen perteneciendo a sus canales — este sitio solo los referencia,
          no los aloja.
        </p>
      ),
    },
    {
      id: "responsabilidad",
      title: "Responsabilidad, cambios y ley aplicable",
      content: (
        <p>
          Hacemos lo posible por publicar información precisa; si encontrás un error, escribinos a {contact} y lo
          corregimos. Podemos actualizar estos términos cuando cambien las funciones del sitio (la fecha de arriba
          refleja la versión vigente). Se rigen por las leyes de la República del Perú.
        </p>
      ),
    },
  ];

  return <LegalPageLayout title="Términos de Uso" updatedAt={UPDATED_AT} sections={sections} />;
}
