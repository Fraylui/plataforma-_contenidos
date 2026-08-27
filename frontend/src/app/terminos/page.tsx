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
      id: "aceptacion",
      title: "Aceptación de estos términos",
      content: (
        <p>
          Al navegar {settings.name} aceptas estos términos de uso. Si no estás de acuerdo, la única opción es dejar
          de usar el sitio — hoy no requiere registro ni pago para leer el contenido publicado.
        </p>
      ),
    },
    {
      id: "que-es",
      title: "Qué es este sitio",
      content: (
        <p>
          {settings.name} es una plataforma de contenidos digitales: artículos, lugares, fotografías y video sobre
          temas de actualidad, turismo, cultura e historias locales. Todo el contenido publicado pasa por un proceso
          editorial antes de salir al público.
        </p>
      ),
    },
    {
      id: "uso-permitido",
      title: "Uso permitido",
      content: (
        <>
          <p>Puedes leer, compartir y enlazar el contenido publicado libremente.</p>
          <p>
            No está permitido: reproducir artículos completos en otro sitio sin autorización, extraer contenido de
            forma automatizada y masiva (scraping) para republicarlo, ni usar el sitio para actividades ilegales.
          </p>
        </>
      ),
    },
    {
      id: "contenido-publicidad",
      title: "Contenido editorial y publicidad",
      content: (
        <p>
          El contenido editorial y la publicidad se muestran claramente diferenciados. Cualquier contenido
          patrocinado se marca como tal de forma visible — nunca se presenta como una nota editorial independiente.
          {settings.adsenseEnabled &&
            " Este sitio muestra publicidad a través de Google AdSense; ver la Política de Privacidad para más detalles sobre las cookies asociadas."}
        </p>
      ),
    },
    {
      id: "propiedad-intelectual",
      title: "Propiedad intelectual",
      content: (
        <p>
          Los textos, fotografías y demás contenido original publicado en {settings.name} son propiedad de{" "}
          {settings.name} o de sus autores/colaboradores, y están protegidos por derechos de autor. Los videos de
          YouTube embebidos siguen perteneciendo a sus respectivos canales — este sitio solo referencia el video, no
          lo aloja.
        </p>
      ),
    },
    {
      id: "responsabilidad",
      title: "Limitación de responsabilidad",
      content: (
        <p>
          Hacemos lo posible por publicar información precisa y actualizada, pero no garantizamos que el contenido
          esté siempre libre de errores. Si encuentras una inexactitud, escríbenos a {contact} y la corregimos.
        </p>
      ),
    },
    {
      id: "cambios",
      title: "Cambios a estos términos",
      content: (
        <p>
          Podemos actualizar estos términos cuando cambien las funciones del sitio. La fecha de &ldquo;Última
          actualización&rdquo; al inicio de esta página refleja la versión vigente.
        </p>
      ),
    },
    {
      id: "ley-aplicable",
      title: "Ley aplicable",
      content: <p>Estos términos se rigen por las leyes de la República del Perú.</p>,
    },
  ];

  return <LegalPageLayout title="Términos de Uso" updatedAt={UPDATED_AT} sections={sections} />;
}
