/** El backend respondió 404: esperable (un enlace viejo), no es un fallo. */
export class NotFoundError extends Error {}

/**
 * El backend respondió con error: guarda el código y su X-Request-Id para
 * encontrar el mismo fallo en los logs del backend (RequestIdFilter, MDC).
 */
export class BackendError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId: string | null,
  ) {
    super(message);
  }
}
