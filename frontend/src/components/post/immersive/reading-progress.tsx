/**
 * Barra fina arriba que se llena mientras se lee (detalle inmersivo). Solo
 * CSS (`.reading-progress` en globals.css, animation-timeline: scroll());
 * sin soporte queda vacía. Decorativa: el lector de pantalla ya sabe dónde está.
 */
export function ReadingProgress() {
  return (
    <div
      aria-hidden="true"
      className="reading-progress pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] origin-left scale-x-0 bg-accent-fill"
    />
  );
}
