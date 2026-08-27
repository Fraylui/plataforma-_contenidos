import type { Metadata } from "next";
import { getPlatformSettings } from "@/lib/api/client";
import { LegalPageLayout, type LegalSection } from "@/components/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  robots: "index,follow",
};

const UPDATED_AT = "27 de agosto de 2026";

export default async function PrivacyPolicyPage() {
  const settings = await getPlatformSettings();
  const contact = settings.contactEmail || "el correo de contacto publicado en este sitio";

  const sections: LegalSection[] = [
    {
      id: "responsable",
      title: "Quién es el responsable",
      content: (
        <>
          <p>
            <strong>{settings.name}</strong> es responsable del tratamiento de los datos que se describen en esta
            política. Puedes contactarnos en {contact} para cualquier consulta sobre privacidad.
          </p>
        </>
      ),
    },
    {
      id: "que-recopilamos",
      title: "Qué información recopilamos",
      content: (
        <>
          <p>Hoy este sitio no tiene registro de usuarios ni formularios que pidan datos personales al público.</p>
          <p>
            Lo que sí se genera automáticamente al navegar: la dirección IP y datos técnicos del navegador
            (user-agent, páginas visitadas) que procesa cualquier servidor web para funcionar, y las cookies descritas
            en la siguiente sección.
          </p>
          <p>
            Si en el futuro habilitamos cuentas de usuario, comentarios o un newsletter, esta política se actualizará
            antes de que esas funciones estén disponibles.
          </p>
        </>
      ),
    },
    {
      id: "cookies",
      title: "Cookies",
      content: (
        <>
          <p>
            Al entrar por primera vez te preguntamos si aceptas o rechazas cookies — ambas opciones están disponibles
            por igual, no solo &ldquo;aceptar&rdquo;. Puedes cambiar tu decisión en cualquier momento borrando las
            cookies de este sitio desde la configuración de tu navegador.
          </p>
          <p>Las cookies que puede usar este sitio son:</p>
          <ul className="list-disc space-y-1.5 pl-6">
            <li>
              <strong>Necesarias:</strong> el panel administrativo (uso interno del equipo editorial) usa cookies de
              sesión para mantener el inicio de sesión. No se activan para un visitante que solo lee el sitio.
            </li>
            {settings.adsenseEnabled && (
              <li>
                <strong>Publicidad (Google AdSense):</strong> si aceptas cookies, Google puede usar cookies propias y
                de terceros para mostrar anuncios, incluyendo personalización basada en tus visitas a este y otros
                sitios. Puedes gestionar la personalización de anuncios de Google en{" "}
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
            )}
          </ul>
        </>
      ),
    },
    {
      id: "terceros",
      title: "Servicios de terceros",
      content: (
        <>
          <p>Este sitio puede incrustar contenido de terceros, cada uno con su propia política de privacidad:</p>
          <ul className="list-disc space-y-1.5 pl-6">
            <li>
              <strong>YouTube:</strong> los videos embebidos en artículos y lugares se cargan solo cuando haces clic
              para reproducirlos (nunca automáticamente) y en ese momento aplica la{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-accent"
              >
                política de privacidad de Google/YouTube
              </a>
              .
            </li>
            {settings.adsenseEnabled && (
              <li>
                <strong>Google AdSense:</strong> ver{" "}
                <a
                  href="https://policies.google.com/technologies/partner-sites"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-accent"
                >
                  cómo usa Google los datos de sitios que usan sus servicios
                </a>
                .
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
          Si eres una persona en Perú, la Ley N.º 29733 (Ley de Protección de Datos Personales) te da derecho a
          acceder, rectificar, cancelar y oponerte al tratamiento de tus datos personales (derechos ARCO). Para
          ejercerlos, escríbenos a {contact}.
        </p>
      ),
    },
    {
      id: "seguridad",
      title: "Seguridad",
      content: (
        <p>
          Tomamos medidas razonables para proteger la información que procesamos (conexión cifrada HTTPS, acceso
          restringido al panel administrativo). Ningún sistema es 100% seguro, pero no dejamos esto librado al azar.
        </p>
      ),
    },
    {
      id: "cambios",
      title: "Cambios a esta política",
      content: (
        <p>
          Podemos actualizar esta política cuando cambie lo que hacemos con los datos (por ejemplo, al activar
          analítica, comentarios o registro de usuarios). La fecha de &ldquo;Última actualización&rdquo; al inicio de
          esta página refleja la versión vigente.
        </p>
      ),
    },
  ];

  return <LegalPageLayout title="Política de Privacidad" updatedAt={UPDATED_AT} sections={sections} />;
}
