import type { HomeItem } from "@/lib/home-items";
import { formatPublicationDate, formatShortDate } from "@/lib/content-labels";
import { formatCelebrationDate } from "@/lib/celebration-date";

export interface PostBrand {
  name: string;
  logoUrl: string | null;
}

/** Fecha ISO usable para el encabezado según el tipo, o null si falta o es inválida. */
type DatedItem = Pick<HomeItem, "kind" | "sortDate" | "startsAt" | "allDay" | "recursYearly">;

function postDateIso(item: DatedItem): string | null {
  const iso = item.kind === "celebracion" ? (item.startsAt ?? item.sortDate) : item.sortDate;
  return iso && !Number.isNaN(Date.parse(iso)) ? iso : null;
}

/**
 * Fecha del encabezado según la regla de cada tipo (CONTEXTO, memoria de
 * fechas): publicaciones en relativo ("hace 2 h"), eventos con su fecha y
 * hora absolutas, el resto con fecha corta absoluta. Sin fecha válida, ""
 * — un dato faltante nunca debe romper la página (pasó en el build con un
 * backend desactualizado).
 */
function postTimeLabel(item: DatedItem): string {
  const iso = postDateIso(item);
  if (!iso) return "";
  if (item.kind === "celebracion") return formatCelebrationDate({ at: iso, allDay: Boolean(item.allDay), recursYearly: Boolean(item.recursYearly) });
  if (item.kind === "publicacion") return formatPublicationDate(iso);
  return formatShortDate(iso);
}

export interface PostHeaderTime {
  label: string;
  iso: string;
  /** «actualizado hace 2 d»: solo si cambió bastante después de publicarse (ver updatedTimeFor). */
  updated?: { label: string; iso: string } | null;
}

/** Un retoque en las primeras 24 h (una errata) no cuenta como actualización. */
const UPDATE_MARGIN_MS = 24 * 60 * 60 * 1000;

/**
 * Agrega «actualizado …» a la fecha de una publicación cuando se editó al
 * menos un día después de publicarse: el lector sabe que el dato es vigente
 * y Google lo usa como señal de frescura (dateModified ya va en el JSON-LD).
 */
export function updatedTimeFor(time: PostHeaderTime | null, updatedAt: string | null | undefined): PostHeaderTime | null {
  if (!time || !updatedAt) return time;
  const published = Date.parse(time.iso);
  const updated = Date.parse(updatedAt);
  if (Number.isNaN(updated) || updated - published < UPDATE_MARGIN_MS) return time;
  return { ...time, updated: { label: formatPublicationDate(updatedAt), iso: updatedAt } };
}

/** Fecha del encabezado ya resuelta para un ítem del feed, o null si no hay una válida. */
export function headerTimeFor(item: DatedItem): PostHeaderTime | null {
  const iso = postDateIso(item);
  return iso ? { label: postTimeLabel(item), iso } : null;
}

/**
 * Encabezado de post (tarjeta del feed y vista de contenido): la marca es la
 * "cuenta" que publica (sin firma de autor), luego tipo, tema y tiempo — sin
 * antetítulo en mayúsculas. `as`: "header" en la tarjeta; en la vista de
 * contenido también.
 */
export function PostHeader({
  brand,
  typeLabel,
  categoryName,
  time,
  className,
  onImage = false,
}: {
  brand: PostBrand;
  typeLabel: string;
  categoryName?: string;
  time: PostHeaderTime | null;
  className?: string;
  /** Sobre una foto con degradado (portada inmersiva): texto blanco en vez de los tonos del lienzo. */
  onImage?: boolean;
}) {
  const strong = onImage ? "text-white" : "text-foreground";
  const soft = onImage ? "text-white/80" : "text-muted";
  return (
    <header data-testid="post-header" className={className ?? "flex items-center gap-3 px-4 py-3"}>
      {brand.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- logo definido en Configuración, host arbitrario
        <img src={brand.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-accent-fill/70" />
      ) : (
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-fill text-sm font-black text-accent-foreground">
          {brand.name.charAt(0)}
        </span>
      )}
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm">
          <span className={`font-bold ${strong}`}>{brand.name}</span>
          <span className={soft}> · {typeLabel}</span>
        </p>
        <p className={`truncate text-xs ${soft}`}>
          {categoryName && (
            <>
              {categoryName}
              {time && " · "}
            </>
          )}
          {time && (
            <time dateTime={time.iso} suppressHydrationWarning>
              {time.label}
            </time>
          )}
          {time?.updated && (
            <>
              {" · actualizado "}
              <time dateTime={time.updated.iso} suppressHydrationWarning>
                {time.updated.label}
              </time>
            </>
          )}
        </p>
      </div>
    </header>
  );
}
