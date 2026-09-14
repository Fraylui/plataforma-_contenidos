/**
 * Categoría de la tarjeta, sola (sin el tipo de contenido al lado). Antes
 * mostraba "Turismo · Artículo": el tipo (Artículo/Lugar/Evento...) es un
 * dato real y sigue existiendo — el admin lo necesita para publicar y
 * clasificar — pero de cara al visitante es ruido: no ayuda a decidir qué
 * leer, y en listados de un solo tipo (toda la grilla de Directorio
 * diciendo "Restaurante" en cada tarjeta) era puro texto repetido. La
 * categoría sí ayuda a explorar (tema), por eso es lo único que queda.
 * Sin categoría no se renderiza nada (nunca cae de vuelta al tipo).
 */
export function CardKicker({ categoryName }: { categoryName?: string | null }) {
  if (!categoryName) return null;
  return <span className="text-[11px] font-semibold tracking-wider text-accent uppercase">{categoryName}</span>;
}
