import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Paginación server-rendered (links normales, sin JS) — mismo patrón ya
 * probado en app/admin/(protected)/auditoria/page.tsx, generalizado para
 * el sitio público. `page` es 0-indexado (como PageResponse del backend);
 * `buildHref` arma la URL completa para una página dada, dejando que cada
 * pantalla decida qué otros query params conservar (filtros, etc.).
 */
export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const BTN =
    "inline-flex items-center gap-1.5 rounded-full border border-foreground/[0.08] bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent/50 hover:text-accent";
  const BTN_DISABLED =
    "inline-flex items-center gap-1.5 rounded-full border border-foreground/[0.06] bg-surface px-4 py-2 text-sm font-semibold text-muted/50";

  return (
    <div className="mt-10 flex items-center justify-between gap-4">
      {page > 0 ? (
        <Link href={buildHref(page - 1)} className={BTN}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Anterior
        </Link>
      ) : (
        <span aria-hidden="true" className={BTN_DISABLED}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Anterior
        </span>
      )}

      <span className="text-xs font-semibold tracking-wide text-muted uppercase">
        Página {page + 1} de {totalPages}
      </span>

      {page + 1 < totalPages ? (
        <Link href={buildHref(page + 1)} className={BTN}>
          Siguiente
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span aria-hidden="true" className={BTN_DISABLED}>
          Siguiente
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
    </div>
  );
}
