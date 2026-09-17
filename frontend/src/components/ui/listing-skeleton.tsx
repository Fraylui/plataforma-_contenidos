/**
 * Esqueleto de carga para las páginas de listado (Publicaciones, Lugares,
 * Eventos, Galerías, Directorio) — mismo layout real (encabezado + fila de
 * filtros + grilla de tarjetas 16:10) para que no haya "salto" cuando el
 * contenido real reemplaza al esqueleto. Usado por cada loading.tsx de
 * esas rutas (Next.js lo muestra instantáneo durante la navegación,
 * mientras el Server Component de la página pide los datos).
 */
export function ListingSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-border/60" />
      <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-border/60" />

      <div className="mt-6 flex gap-2 border-b border-foreground/[0.06] pb-4">
        <div className="h-8 w-36 animate-pulse rounded-full bg-border/60" />
        <div className="h-8 w-32 animate-pulse rounded-full bg-border/60" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-foreground/[0.06] bg-surface">
            <div className="aspect-[16/10] animate-pulse bg-border/60" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-16 animate-pulse rounded bg-border/60" />
              <div className="h-4 w-full animate-pulse rounded bg-border/60" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-border/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
