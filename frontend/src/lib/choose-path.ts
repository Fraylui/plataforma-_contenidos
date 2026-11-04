import type { FeedItem, FeedItemType } from "@/lib/api/types";

/**
 * "Elige tu camino": al terminar un contenido, en vez de una grilla más de
 * relacionados, el lector ve tres puertas con intención distinta:
 *
 *  - deeper:    seguir en el mismo tema (misma categoría).
 *  - otherForm: el mismo tema contado en otro formato (si leyó una
 *               publicación → un lugar o un evento, y viceversa). Es el
 *               diagrama Lugar→Historia→Evento de CONTEXTO.md sección 2
 *               hecho navegación.
 *  - surprise:  algo de otro tema, para no quedar encerrado en uno solo.
 *
 * Solo contenido real que ya existe (sección 45: nunca relleno). La
 * elección es determinista por contenido (sin aleatoriedad por visita) para
 * que la página siga siendo cacheable de punta a punta.
 */
export interface ChosenPaths {
  deeper: FeedItem | null;
  otherForm: FeedItem | null;
  surprise: FeedItem | null;
}

export function choosePaths(params: {
  currentId: string;
  currentType: FeedItemType;
  categoryId: string | null;
  /** Misma categoría, ya ordenados por relevancia (FeedService.getRelated). */
  related: FeedItem[];
  /** Feed general (cualquier categoría), en el orden del feed. */
  pool: FeedItem[];
}): ChosenPaths {
  const { currentId, currentType, categoryId, related, pool } = params;
  const used = new Set<string>([currentId]);
  const take = (item: FeedItem | undefined | null): FeedItem | null => {
    if (!item) return null;
    used.add(item.id);
    return item;
  };
  const free = (item: FeedItem) => !used.has(item.id);
  const sameCategory = (item: FeedItem) => categoryId != null && item.categoryId === categoryId;

  // Primero "otro formato": es la puerta más escasa (puede no existir un
  // lugar/evento del tema), así no se la gasta la puerta "más profundo".
  const otherFormCandidates = [
    ...related.filter((item) => item.type !== currentType),
    ...pool.filter((item) => item.type !== currentType && sameCategory(item)),
  ];
  const otherForm = take(otherFormCandidates.find(free));

  const deeper = take([...related, ...pool.filter(sameCategory)].find(free));

  const surpriseCandidates = pool.filter((item) => free(item) && !sameCategory(item));
  const surprise = take(
    surpriseCandidates.length > 0 ? surpriseCandidates[stableIndex(currentId, surpriseCandidates.length)] : null,
  );

  return { deeper, otherForm, surprise };
}

/** Cuántas puertas hay de verdad: con menos de 2 no tiene sentido "elegir". */
export function countPaths(paths: ChosenPaths): number {
  return [paths.deeper, paths.otherForm, paths.surprise].filter(Boolean).length;
}

/** Índice estable en [0, length) a partir del id: cada contenido sorprende con algo distinto, siempre lo mismo. */
function stableIndex(id: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % length;
}
