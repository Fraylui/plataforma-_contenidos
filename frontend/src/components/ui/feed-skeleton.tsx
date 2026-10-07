const PULSE = "animate-pulse bg-canvas-strong";

/**
 * Esqueleto de carga de las pantallas de feed (inicio, secciones, Agenda,
 * temas): círculos de temas, chips y dos posts — el mismo diseño que
 * FeedScreen, así no hay salto cuando llega el contenido. Sin líneas ni
 * bordes, como el resto del sitio.
 */
export function FeedSkeleton() {
  return (
    <div className="flex w-full justify-center py-3 sm:px-4 sm:py-6" aria-busy="true" aria-label="Cargando">
      <div className="w-full max-w-[630px]">
        <div className="flex gap-4 overflow-hidden px-4 sm:px-0">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex shrink-0 flex-col items-center gap-2">
              <div className={`h-16 w-16 rounded-full ${PULSE}`} />
              <div className={`h-2.5 w-12 rounded ${PULSE}`} />
            </div>
          ))}
        </div>
        <div className="mt-4 mb-3 flex gap-2 px-4 sm:px-0">
          {[56, 104, 72, 80].map((w) => (
            <div key={w} className={`h-9 rounded-full ${PULSE}`} style={{ width: w }} />
          ))}
        </div>
        <div className="flex flex-col sm:gap-6">
          {[0, 1].map((i) => (
            <div key={i} className="bg-surface sm:rounded-2xl">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className={`h-9 w-9 rounded-full ${PULSE}`} />
                <div className={`h-3 w-32 rounded ${PULSE}`} />
              </div>
              <div className={`aspect-square ${PULSE}`} />
              <div className="space-y-2 px-4 py-4">
                <div className={`h-3 w-3/4 rounded ${PULSE}`} />
                <div className={`h-3 w-1/2 rounded ${PULSE}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Esqueleto de la cuadrícula de 3 (Explorar, resultados de búsqueda). */
export function GridSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[935px] py-3 sm:px-4 sm:py-6" aria-busy="true" aria-label="Cargando">
      <div className="mb-3 flex gap-2 px-4 sm:px-0">
        {[56, 104, 72, 80].map((w) => (
          <div key={w} className={`h-9 rounded-full ${PULSE}`} style={{ width: w }} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className={`aspect-square ${PULSE}`} />
        ))}
      </div>
    </div>
  );
}
