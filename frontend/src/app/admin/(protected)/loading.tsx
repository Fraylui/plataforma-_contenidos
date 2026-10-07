/**
 * Mientras carga una sección del panel: la forma de la página (título y
 * tarjetas) en gris suave, para que no se vea en blanco ni salte al llegar.
 */
export default function AdminLoading() {
  return (
    <div role="status" aria-label="Cargando" className="animate-pulse space-y-6 motion-reduce:animate-none">
      <div className="h-9 w-64 max-w-full rounded-control bg-field" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 rounded-card bg-surface shadow-card" />
        ))}
      </div>
      <div className="space-y-3 rounded-card bg-surface p-5 shadow-card">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-10 rounded-control bg-field" />
        ))}
      </div>
    </div>
  );
}
