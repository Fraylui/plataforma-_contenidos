import Link from "next/link";

/**
 * Rango de fechas para Eventos en /buscar — el único tipo de contenido con
 * una fecha propia con sentido de filtro (los demás ordenan por fecha de
 * publicación, no algo que quien busca elija). Solo se muestra cuando el
 * filtro de tipo está en "Eventos" (ver buscar/page.tsx). Formulario GET
 * plano (sin JS): los demás filtros activos viajan como campos ocultos para
 * no perderse al aplicar fechas.
 */
export function EventDateRangeFilter({
  q,
  categoryId,
  from,
  to,
  clearHref,
}: {
  q: string;
  categoryId: string | null;
  from: string | null;
  to: string | null;
  clearHref: string;
}) {
  const inputClass =
    "rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus-visible:border-accent";

  return (
    <form action="/buscar" className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="q" value={q} />
      <input type="hidden" name="type" value="EVENT" />
      {categoryId && <input type="hidden" name="categoryId" value={categoryId} />}

      <div>
        <label htmlFor="search-date-from" className="mb-1 block text-xs font-medium text-muted">
          Desde
        </label>
        <input id="search-date-from" type="date" name="from" defaultValue={from ?? ""} className={inputClass} />
      </div>
      <div>
        <label htmlFor="search-date-to" className="mb-1 block text-xs font-medium text-muted">
          Hasta
        </label>
        <input id="search-date-to" type="date" name="to" defaultValue={to ?? ""} className={inputClass} />
      </div>

      <button
        type="submit"
        className="h-9 shrink-0 rounded-md border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent-soft hover:text-accent"
      >
        Aplicar fechas
      </button>
      {(from || to) && (
        <Link href={clearHref} className="text-xs font-medium text-muted underline underline-offset-2 hover:text-accent">
          Quitar fechas
        </Link>
      )}
    </form>
  );
}
