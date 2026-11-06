/**
 * Último tema usado al crear, recordado en este navegador: quien publica
 * casi siempre sigue en el mismo tema, y sin tema el borrador no se guarda
 * solo. Lo comparten todos los compositores (Historias incluidas).
 */
export const LAST_TOPIC_KEY = "panel-ultimo-tema";

export function readLastTopic(storage: Pick<Storage, "getItem"> | null = safeStorage()): string {
  try {
    return storage?.getItem(LAST_TOPIC_KEY) ?? "";
  } catch {
    return "";
  }
}

export function rememberTopic(id: string, storage: Pick<Storage, "setItem"> | null = safeStorage()): void {
  if (!id) return;
  try {
    storage?.setItem(LAST_TOPIC_KEY, id);
  } catch {
    // Sin almacenamiento (modo privado, bloqueado): la próxima vez se elige de nuevo.
  }
}

/** El tema recordado, solo si sigue existiendo entre los temas activos. */
export function pickRememberedTopic(categories: { id: string }[], remembered: string): string {
  return categories.some((category) => category.id === remembered) ? remembered : "";
}

function safeStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
