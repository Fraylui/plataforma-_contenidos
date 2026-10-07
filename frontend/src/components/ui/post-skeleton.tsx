const PULSE = "animate-pulse bg-canvas-strong";

/**
 * Esqueleto de carga de la vista de post (los 5 detalles): encabezado de
 * marca, medio cuadrado y texto; en escritorio, medio a la izquierda y
 * texto a la derecha como PostView.
 */
export function PostSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1040px] pb-8 sm:px-4 sm:pt-4" aria-busy="true" aria-label="Cargando">
      <div className="lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-x-10">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-0 lg:col-start-2 lg:row-start-1">
          <div className={`h-9 w-9 rounded-full ${PULSE}`} />
          <div className={`h-3 w-32 rounded ${PULSE}`} />
        </div>
        <div className={`aspect-square sm:rounded-2xl ${PULSE} lg:col-start-1 lg:row-span-2 lg:row-start-1`} />
        <div className="space-y-3 px-4 pt-4 sm:px-0 lg:col-start-2 lg:row-start-2">
          <div className={`h-7 w-5/6 rounded ${PULSE}`} />
          <div className={`h-7 w-2/3 rounded ${PULSE}`} />
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={`h-3.5 w-full rounded ${PULSE}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
