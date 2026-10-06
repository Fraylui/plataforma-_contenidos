import type { Metadata } from "next";
import Link from "next/link";
import { getPlatformSettings } from "@/lib/api/client";
import { LegalPageLayout, type LegalSection } from "@/components/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "Contacto",
  robots: "index,follow",
};

const UPDATED_AT = "4 de octubre de 2026";

/**
 * Tercera página institucional junto a /privacidad y /terminos: AdSense
 * revisa que el sitio tenga una forma visible de contactar a quien lo
 * publica. Mismo layout que las legales. El correo sale de Configuración
 * (contactEmail) — sin formulario a propósito: un formulario necesita
 * envío de correo, antispam y guardar mensajes, y un mailto cumple lo mismo.
 */
export default async function ContactPage() {
  const settings = await getPlatformSettings();
  const email = settings.contactEmail;
  const mail = (subject: string) => (email ? `mailto:${email}?subject=${encodeURIComponent(subject)}` : undefined);

  const sections: LegalSection[] = [
    {
      id: "quienes-somos",
      title: "Quiénes somos",
      content: (
        <p>
          {settings.name} es una plataforma de contenidos: publicaciones, lugares, eventos, galerías y un directorio,
          publicados por nuestro propio equipo.
          {settings.description ? ` ${settings.description}` : ""}
        </p>
      ),
    },
    {
      id: "escribenos",
      title: "Escríbenos",
      content: email ? (
        <>
          <p>
            Nuestro correo es{" "}
            <a href={`mailto:${email}`} className="font-medium text-accent underline underline-offset-2">
              {email}
            </a>
            . Para que tu mensaje llegue a quien corresponde, usa el asunto que mejor encaje:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <a href={mail("Propuesta de contenido")} className="text-accent underline underline-offset-2">
                Propuesta de contenido
              </a>{" "}
              — un lugar, evento o historia que debería estar aquí.
            </li>
            <li>
              <a href={mail("Corrección")} className="text-accent underline underline-offset-2">
                Corrección
              </a>{" "}
              — un dato equivocado o desactualizado en algo que publicamos.
            </li>
            <li>
              <a href={mail("Publicidad")} className="text-accent underline underline-offset-2">
                Publicidad
              </a>{" "}
              — anunciar tu negocio o evento en el sitio.
            </li>
            <li>
              <a href={mail("Derechos de autor")} className="text-accent underline underline-offset-2">
                Derechos de autor
              </a>{" "}
              — si crees que algo publicado aquí usa material tuyo sin permiso.
            </li>
          </ul>
        </>
      ) : (
        <p>Todavía no hay un correo de contacto publicado. Vuelve pronto.</p>
      ),
    },
    {
      id: "privacidad",
      title: "Tus datos",
      content: (
        <p>
          Solo usamos tu correo para responderte. Más detalle en la{" "}
          <Link href="/privacidad" className="text-accent underline underline-offset-2">
            Política de privacidad
          </Link>
          .
        </p>
      ),
    },
  ];

  return <LegalPageLayout title="Contacto" updatedAt={UPDATED_AT} sections={sections} />;
}
