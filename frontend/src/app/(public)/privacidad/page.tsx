import type { Metadata } from "next";
import { getPlatformSettings } from "@/lib/api/client";
import { LegalPageLayout, type LegalSection } from "@/components/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Qué datos se generan al visitar el sitio, qué cookies usamos y cómo ejercer tus derechos.",
  robots: "index,follow",
  // Sin canonical propio heredaba el del layout raíz («/») y Google la tomaba por un duplicado del Inicio.
  alternates: { canonical: "/privacidad" },
};

const UPDATED_AT = "16 de octubre de 2026";

export default async function PrivacyPolicyPage() {
  const settings = await getPlatformSettings();
  const contact = settings.contactEmail || "nuestro correo de contacto (lo publicaremos en este sitio)";

  const sections: LegalSection[] = [
    {
      id: "responsable",
      title: "Responsable",
      content: (
        <p>
          <strong>{settings.name}</strong> es responsable de los datos que se describen acá. Para consultas, escribe a {contact}.
        </p>
      ),
    },
    {
      id: "que-recopilamos",
      title: "Qué recopilamos",
      content: (
        <>
          <p>
            Hoy este sitio no pide registro ni datos personales para leer el contenido. Lo único que se genera al
            navegar es lo técnico habitual (IP, navegador) y las cookies de la siguiente sección.
          </p>
          <p>Si más adelante agregamos cuentas, comentarios o newsletter, actualizamos esta página antes de activarlo.</p>
        </>
      ),
    },
    {
      id: "cookies",
      title: "Cookies y terceros",
      content: (
        <>
          <p>
            Al entrar te preguntamos si aceptas o rechazas cookies — ambas opciones pesan igual, no solo
            &ldquo;aceptar&rdquo;. Puedes cambiar de decisión borrando las cookies del sitio desde tu navegador.
          </p>
          <ul className="list-disc space-y-1.5 pl-6">
            <li>
              <strong>Necesarias:</strong> sesión del panel administrativo (equipo que gestiona el contenido). No se
              activan para quien solo lee el sitio.
            </li>
            <li>
              <strong>YouTube:</strong> los videos se cargan solo si haces clic para reproducirlos, nunca antes; ahí
              aplica la{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-accent"
              >
                política de Google/YouTube
              </a>
              .
            </li>
            {settings.adsenseEnabled ? (
              <li>
                <strong>Publicidad (Google AdSense):</strong> si aceptas cookies, Google puede personalizar anuncios
                según tus visitas. Gestión en{" "}
                <a
                  href="https://myadcenter.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-accent"
                >
                  myadcenter.google.com
                </a>
                .
              </li>
            ) : (
              <li>
                <strong>Publicidad:</strong> hoy no mostramos anuncios personalizados. Si activamos AdSense u otra
                analítica, esta sección se actualiza y el banner de cookies vuelve a pedir tu consentimiento.
              </li>
            )}
          </ul>
        </>
      ),
    },
    {
      id: "derechos",
      title: "Tus derechos",
      content: (
        <p>
          En Perú, la Ley N.º 29733 te da derecho a acceder, rectificar, cancelar y oponerte al uso de tus datos
          (derechos ARCO). Para ejercerlos, escríbenos a {contact}.
        </p>
      ),
    },
    {
      id: "cambios",
      title: "Seguridad y cambios",
      content: (
        <p>
          Usamos HTTPS y acceso restringido al panel administrativo. Actualizamos esta página cuando cambia lo que
          hacemos con los datos — la fecha de arriba refleja la versión vigente.
        </p>
      ),
    },
  ];

  return <LegalPageLayout title="Política de Privacidad" updatedAt={UPDATED_AT} sections={sections} />;
}
