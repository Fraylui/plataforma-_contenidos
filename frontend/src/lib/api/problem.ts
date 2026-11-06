/**
 * Error de la API en formato RFC 9457 «Problem Details» (ver Problems.java):
 * `detail` es el mensaje para mostrar, `code` distingue casos que el panel
 * trata aparte y `errors` trae la validación campo por campo.
 */
interface ProblemDetail {
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  errors?: { field: string; message: string }[];
}

/** El texto que ve quien usa el panel: el detalle y, si hay, qué campo falló. */
export function problemMessage(body: unknown, status: number): string {
  const problem = (body ?? {}) as ProblemDetail;
  const detail = problem.detail ?? problem.title ?? `Error del servidor (${status})`;
  const fields = (problem.errors ?? []).map((error) => `${error.field}: ${error.message}`);
  return fields.length > 0 ? `${detail} (${fields.join("; ")})` : detail;
}
