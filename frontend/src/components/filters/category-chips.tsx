import Link from "next/link";
import type { Category } from "@/lib/api/types";

/**
 * Filtro por categoría de los 6 listados públicos, en chips de una línea —
 * mismo patrón visual que las pestañas de Eventos (cuándo) y Directorio
 * (tipo de negocio). Reemplaza a ListingFilters (select + cascada de
 * geografía): la geografía se quitó de los listados por completo, los
 * filtros finos de ubicación viven solo en /buscar. Server-rendered con
 * `<Link>` (sin JS) para que el resultado filtrado sea un enlace
 * compartible/con back del navegador, mismo criterio que el resto del sitio.
 */
export function CategoryChips({
  categories,
  activeCategoryId,
  buildHref,
}: {
  categories: Category[];
  activeCategoryId: string | null;
  buildHref: (categoryId: string | null) => string;
}) {
  return (
    <nav aria-label="Filtrar por categoría" className="flex flex-wrap gap-2">
      <Link
        href={buildHref(null)}
        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
          activeCategoryId === null ? "bg-accent text-accent-foreground" : "bg-surface text-muted hover:text-foreground"
        }`}
      >
        Todas
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={buildHref(category.id)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            activeCategoryId === category.id
              ? "bg-accent text-accent-foreground"
              : "bg-surface text-muted hover:text-foreground"
          }`}
        >
          {category.name}
        </Link>
      ))}
    </nav>
  );
}
