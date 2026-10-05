import type { ReactNode } from "react";

/**
 * Encabezado de los listados (Publicaciones, Lugares, Eventos, Galerías,
 * Directorio) en UNA franja a todo el ancho: título y descripción a la
 * izquierda; cantidad de resultados y filtros a la derecha, alineados a la
 * base — el patrón de las páginas de colección de Amazon/Shopify y de la
 * barra de pestañas de MSN. Antes el título iba en una columna de media
 * pantalla (max-w-2xl) y los filtros solos en otra fila debajo: las dos
 * franjas dejaban la mitad derecha vacía, y se veía a medio hacer.
 * En celular se apila: título arriba, controles debajo.
 */
export function ListingHeader({
  title,
  description,
  count,
  children,
}: {
  title: string;
  description?: string | null;
  /** Texto ya armado ("22 publicaciones", "8 próximos") — cada listado sabe cómo nombrar lo que cuenta. */
  count?: string | null;
  /** Filtros del listado (FilterMenu, pestañas de fecha...). */
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-foreground/[0.06] pb-6 md:flex-row md:items-end md:justify-between md:gap-8">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">{description}</p>}
      </div>
      {(count || children) && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
          {count && (
            <p className="mr-1 text-sm font-medium text-muted tabular-nums" aria-live="polite">
              {count}
            </p>
          )}
          {count && children && <span className="mr-1 hidden h-5 w-px bg-foreground/[0.1] sm:block" aria-hidden="true" />}
          {children}
        </div>
      )}
    </header>
  );
}
