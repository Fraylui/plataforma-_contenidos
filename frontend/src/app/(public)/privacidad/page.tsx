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

const UPDATED_AT = "23 de octubre de 2026";

export default async function PrivacyPolicyPage() {
  const settings = await getPlatformSettings();
  const contact = settings.contactEmail || "nuestro correo de contacto (lo publicaremos en este sitio)";
  // Google (AdSense, Analytics, YouTube) procesa fuera del Perú: la Ley 29733 pide decirlo (flujo transfronterizo).
  const usesGoogle = settings.adsenseEnabled || Boolean(settings.analyticsId);

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
          <p>
            Si nos escribes por correo, usamos tu dirección y tu mensaje solo para responderte. Si contratas publicidad,
            guardamos los datos de contacto del negocio para la campaña y su facturación.
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
            &ldquo;aceptar&rdquo;. Puedes cambiar de decisión borrando los datos de este sitio (cookies y almacenamiento) desde tu navegador.
          </p>
          <ul className="list-disc space-y-1.5 pl-6">
            <li>
              <strong>Necesarias:</strong> sesión del panel administrativo (equipo que gestiona el contenido), que no se
              activa para quien solo lee el sitio; tu respuesta a este aviso y qué historias ya viste (para marcarlas
              en gris), que se guardan solo en tu navegador y no salen de tu dispositivo.
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
                {/* Texto que exige la política de AdSense (support.google.com/adsense/answer/1348695). */}
                <strong>Publicidad (Google AdSense):</strong> proveedores externos, incluido Google, usan cookies para
                mostrarte anuncios según tus visitas anteriores a este sitio y a otros sitios; las cookies de
                publicidad de Google permiten que Google y sus socios te muestren anuncios basados en esas visitas.
                Solo se personalizan si aceptas cookies. Puedes desactivar los anuncios personalizados en la{" "}
                <a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-accent">
                  Configuración de anuncios de Google
                </a>{" "}
                y, para otros proveedores, en{" "}
                <a href="https://www.aboutads.info/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-accent">
                  www.aboutads.info
                </a>
                .
              </li>
            ) : (
              <li>
                <strong>Publicidad:</strong> hoy no mostramos anuncios personalizados. Si activamos AdSense u otra
                analítica, esta sección se actualiza y el banner de cookies vuelve a pedir tu consentimiento.
              </li>
            )}
            {settings.analyticsId && (
              <li>
                <strong>Medición (Google Analytics):</strong> solo si aceptas cookies, Google cuenta las visitas (páginas
                vistas, tipo de dispositivo, país o ciudad aproximados) para saber qué contenido se lee. No lo usamos
                para identificarte. Puedes bloquearlo con el{" "}
                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-accent">
                  complemento de inhabilitación de Google Analytics
                </a>
                .
              </li>
            )}
          </ul>
          {usesGoogle && (
            <p>
              Google procesa estos datos en sus servidores, que pueden estar fuera del Perú (por ejemplo, en Estados
              Unidos), según la{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-accent">
                política de privacidad de Google
              </a>
              .
            </p>
          )}
        </>
      ),
    },
    {
      id: "derechos",
      title: "Tus derechos",
      content: (
        <p>
          En Perú, la Ley N.º 29733 te da derecho a acceder, rectificar, cancelar y oponerte al uso de tus datos
          (derechos ARCO). Para ejercerlos, escríbenos a {contact}. Si no te respondemos o no estás de acuerdo con la
          respuesta, puedes presentar una reclamación ante la{" "}
          <a href="https://www.gob.pe/anpd" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-accent">
            Autoridad Nacional de Protección de Datos Personales
          </a>
          .
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
