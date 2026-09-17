/**
 * Esqueleto de carga para una página de detalle (Lugar/Evento/Negocio/
 * Galería) — mismo shape que publicaciones/[slug]/loading.tsx
 * (extraído acá para no repetirlo en cada ruta): breadcrumb, título,
 * imagen de portada, y líneas de cuerpo.
 */
export function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="h-3 w-24 animate-pulse rounded bg-border" />
      <div className="mt-4 h-10 w-full animate-pulse rounded bg-border" />
      <div className="mt-2 h-10 w-2/3 animate-pulse rounded bg-border" />
      <div className="mt-6 h-4 w-40 animate-pulse rounded bg-border" />
      <div className="mt-8 aspect-video w-full animate-pulse rounded-2xl bg-border" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 w-full animate-pulse rounded bg-border" />
        ))}
      </div>
    </div>
  );
}
