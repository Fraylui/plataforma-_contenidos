import type { HomeItem } from "@/lib/home-items";
import { formatArticleDate, formatEventDateTime, formatShortDate } from "@/lib/content-labels";

export interface PostBrand {
  name: string;
  logoUrl: string | null;
}

/**
 * Fecha del encabezado según la regla de cada tipo (CONTEXTO, memoria de
 * fechas): publicaciones en relativo ("hace 2 h"), eventos con su fecha y
 * hora absolutas, el resto con fecha corta absoluta.
 */
export function postTimeLabel(item: Pick<HomeItem, "kind" | "sortDate" | "startsAt">): string {
  if (item.kind === "evento") return formatEventDateTime(item.startsAt ?? item.sortDate);
  if (item.kind === "publicacion") return formatArticleDate(item.sortDate || null);
  return formatShortDate(item.sortDate || null);
}

/**
 * Encabezado de post: la marca es la "cuenta" que publica (sin firma de
 * autor), luego tipo, tema y tiempo — sin antetítulo en mayúsculas.
 */
export function PostHeader({ item, brand, categoryName }: { item: HomeItem; brand: PostBrand; categoryName?: string }) {
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
          {categoryName && <>{categoryName} · </>}
          <time dateTime={item.kind === "evento" ? (item.startsAt ?? item.sortDate) : item.sortDate} suppressHydrationWarning>
            {postTimeLabel(item)}
          </time>
        </p>
      </div>
    </header>
  );
}
