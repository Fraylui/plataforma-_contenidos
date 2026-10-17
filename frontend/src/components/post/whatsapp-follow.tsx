import { WhatsappLogo } from "@phosphor-icons/react/dist/ssr";

/**
 * «Síguenos en WhatsApp» al final de una publicación: el camino de regreso
 * más usado en Perú, sin cuentas de lectores ni datos personales (el canal
 * lo maneja WhatsApp). Solo aparece si Configuración tiene el enlace.
 */
export function WhatsAppFollow({ channelUrl, siteName }: { channelUrl: string | null; siteName: string }) {
  if (!channelUrl) return null;
  return (
    <a
      href={channelUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="not-prose mt-8 flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card transition-colors hover:bg-canvas-strong focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
    >
      <WhatsappLogo aria-hidden="true" weight="fill" className="size-8 shrink-0 text-accent" />
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-foreground">Síguenos en WhatsApp</span>
        <span className="block text-sm text-muted">Lo nuevo de {siteName} en el canal, sin registrarte.</span>
      </span>
    </a>
  );
}
