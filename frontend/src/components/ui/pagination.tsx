import Link from "next/link";

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

  return (
    <div className="mt-8 flex items-center justify-between text-sm text-muted">
      <span>
        Página {page + 1} de {totalPages}
      </span>
      <div className="flex gap-2">
        {page > 0 && (
          <Link href={buildHref(page - 1)} className="rounded-md border border-border px-3 py-1.5 hover:bg-surface">
            Anterior
          </Link>
        )}
        {page + 1 < totalPages && (
          <Link href={buildHref(page + 1)} className="rounded-md border border-border px-3 py-1.5 hover:bg-surface">
            Siguiente
          </Link>
        )}
      </div>
    </div>
  );
}
