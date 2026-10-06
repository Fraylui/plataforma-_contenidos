/**
 * Contador de Agenda del riel. Módulo sin dependencias de cliente: lo usa
 * el layout público (componente de servidor) — shell-nav.ts importa los
 * íconos de Phosphor, que solo funcionan en el cliente.
 */
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Eventos que empiezan desde ahora hasta 7 días después (contador de Agenda). */
export function countThisWeek(startsAt: (string | null | undefined)[], now: Date = new Date()): number {
  const from = now.getTime();
  return startsAt.filter((s) => {
    const t = s ? Date.parse(s) : NaN;
    return t >= from && t < from + WEEK_MS;
  }).length;
}
