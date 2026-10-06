import type { ReactNode } from "react";
import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";

const ROW_LINK = "-mx-2 flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-canvas-strong";

export interface PostFact {
  icon: Icon;
  /** Etiqueta corta en minúsculas normales ("Cuándo", "Teléfono"), nunca en mayúsculas. */
  label: string;
  value: ReactNode;
  href?: string;
  external?: boolean;
}

/**
 * Datos útiles del post según el tipo (evento: cuándo y dónde; directorio:
 * dirección, teléfono, correo y web; lugar: el mapa), como el bloque de
 * información de una página de Facebook: filas con ícono en círculo, sin
 * cajas con borde ni etiquetas en mayúsculas. Solo lo que existe — nada
 * inventado. El mapa es el embed simple de Google Maps (sin API key).
 */
export function PostFacts({
  facts,
  map,
}: {
  facts: PostFact[];
  map?: { latitude: number; longitude: number; title: string } | null;
}) {
  if (facts.length === 0 && !map) return null;

  return (
    <div className="flex flex-col gap-4">
      {facts.length > 0 && (
        <ul className="flex flex-col gap-1">
          {facts.map(({ icon: FactIcon, label, value, href, external }) => {
            const content = (
              <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas-strong text-foreground">
                  <FactIcon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs text-muted">{label}</span>
                  <span className="block text-[15px] font-semibold break-words text-foreground">{value}</span>
                </span>
              </>
            );
            return (
              <li key={label}>
                {href?.startsWith("/") ? (
                  <Link href={href} className={ROW_LINK}>
                    {content}
                  </Link>
                ) : href ? (
                  <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={ROW_LINK}>
                    {content}
                  </a>
                ) : (
                  <div className="flex items-center gap-3 py-1.5">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {map && (
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-canvas-strong">
          <iframe
            src={`https://maps.google.com/maps?q=${map.latitude},${map.longitude}&z=15&output=embed`}
            title={`Mapa de ${map.title}`}
            className="h-full w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
    </div>
  );
}
