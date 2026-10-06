import type { HomeItem } from "@/lib/home-items";
import { formatArticleDate, formatEventDateTime, formatShortDate } from "@/lib/content-labels";

export interface PostBrand {
  name: string;
  logoUrl: string | null;
}

/** Fecha ISO usable para el encabezado según el tipo, o null si falta o es inválida. */
function postDateIso(item: Pick<HomeItem, "kind" | "sortDate" | "startsAt">): string | null {
  const iso = item.kind === "evento" ? (item.startsAt ?? item.sortDate) : item.sortDate;
  return iso && !Number.isNaN(Date.parse(iso)) ? iso : null;
}

/**
 * Fecha del encabezado según la regla de cada tipo (CONTEXTO, memoria de
 * fechas): publicaciones en relativo ("hace 2 h"), eventos con su fecha y
 * hora absolutas, el resto con fecha corta absoluta. Sin fecha válida, ""
 * — un dato faltante nunca debe romper la página (pasó en el build con un
 * backend desactualizado).
 */
export function postTimeLabel(item: Pick<HomeItem, "kind" | "sortDate" | "startsAt">): string {
  const iso = postDateIso(item);
  if (!iso) return "";
  if (item.kind === "evento") return formatEventDateTime(iso);
  if (item.kind === "publicacion") return formatArticleDate(iso);
  return formatShortDate(iso);
}

/**
 * Encabezado de post: la marca es la "cuenta" que publica (sin firma de
 * autor), luego tipo, tema y tiempo — sin antetítulo en mayúsculas.
 */
export function PostHeader({ item, brand, categoryName }: { item: HomeItem; brand: PostBrand; categoryName?: string }) {
  const dateIso = postDateIso(item);
  return (
    <header data-testid="post-header" className="flex items-center gap-3 px-4 py-3">
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
          <span className="font-bold text-foreground">{brand.name}</span>
          <span className="text-muted"> · {item.typeLabel}</span>
        </p>
        <p className="truncate text-xs text-muted">
          {categoryName && (
            <>
              {categoryName}
              {dateIso && " · "}
            </>
          )}
          {dateIso && (
            <time dateTime={dateIso} suppressHydrationWarning>
              {postTimeLabel(item)}
            </time>
          )}
        </p>
      </div>
    </header>
  );
}
