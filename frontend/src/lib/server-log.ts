import "server-only";
import { BackendError, NotFoundError } from "@/lib/api/errors";

export { BackendError };

/**
 * Registro mínimo de errores del servidor del frontend (sin servicios de
 * pago): una línea JSON por error en la salida de error, que Docker guarda.
 * Si el error vino del backend lleva su requestId para cruzarlo con sus logs.
 */
export function logError(scope: string, error: unknown, context: Record<string, string | number | null> = {}): void {
  const backend = error instanceof BackendError ? { status: error.status, requestId: error.requestId } : {};
  console.error(
    JSON.stringify({
      level: "error",
      time: new Date().toISOString(),
      service: "frontend",
      scope,
      message: error instanceof Error ? error.message : String(error),
      ...backend,
      ...context,
    }),
  );
}

/**
 * Para `.catch(orNull("lugar"))`: la página sigue sin ese dato, pero el fallo
 * queda registrado. «No encontrado» es esperable y no se registra.
 */
export function orNull(scope: string) {
  return (error: unknown): null => {
    if (!(error instanceof NotFoundError)) logError(scope, error);
    return null;
  };
}

/** Igual que orNull pero con otro valor por defecto (una lista vacía, undefined). */
export function orDefault<T>(scope: string, fallback: T) {
  return (error: unknown): T => {
    orNull(scope)(error);
    return fallback;
  };
}
