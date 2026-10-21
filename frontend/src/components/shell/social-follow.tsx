import { FacebookLogo, InstagramLogo, TiktokLogo, WhatsappLogo, XLogo, YoutubeLogo, type Icon } from "@phosphor-icons/react";
import type { SocialKey } from "@/lib/social-links";
import { cn } from "@/lib/utils";

const ICONS: Record<SocialKey, Icon> = {
  youtube: YoutubeLogo,
  instagram: InstagramLogo,
  tiktok: TiktokLogo,
  facebook: FacebookLogo,
  x: XLogo,
  whatsapp: WhatsappLogo,
};

/**
 * «Síguenos»: las redes oficiales de la plataforma (Configuración → Nuestras
 * redes). Solo enlaces, sin APIs ni rastreadores; sin redes, no se pinta.
 */
export function SocialFollow({
  brandName,
  links,
  className,
}: {
  brandName: string;
  links: { key: SocialKey; label: string; url: string }[];
  className?: string;
}) {
  if (links.length === 0) return null;
  return (
    <div className={className}>
      <p className="text-xs font-semibold text-muted">Síguenos</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {links.map(({ key, label, url }) => {
          const Icon = ICONS[key];
          return (
            <li key={key}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${brandName} en ${label}`}
                title={label}
                className={cn(
                  "flex size-10 items-center justify-center rounded-full bg-canvas-strong text-foreground",
                  "transition-[background-color,color,scale] duration-150 hover:bg-accent-fill hover:text-accent-foreground active:scale-95",
                  "focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none",
                )}
              >
                <Icon weight="fill" className="size-5" aria-hidden="true" />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
