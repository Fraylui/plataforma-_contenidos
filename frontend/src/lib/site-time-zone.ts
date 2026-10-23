/**
 * Zona horaria en la que se leen las fechas del sitio (eventos, publicaciones,
 * panel). Sin esto cada fecha salía en la zona de la máquina que dibuja la
 * página: el servidor (Docker, UTC) mostraba un evento de las 11 p. m. de Lima
 * como el día siguiente a las 4 a. m. Configurable para un sitio de otro país.
 */
export const SITE_TIME_ZONE = process.env.NEXT_PUBLIC_SITE_TIME_ZONE || "America/Lima";

/** Diferencia (ms) entre la hora local de `timeZone` y UTC en el instante `at`. */
function zoneOffsetMs(at: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/**
 * Un día del calendario del sitio ("YYYY-MM-DD", como da <input type="date">)
 * → el instante UTC en que empieza (o termina) ese día en la zona del sitio.
 * Para filtros por fecha: "hasta el 15" incluye las 11 p. m. de Lima del 15.
 */
export function siteDayBoundary(day: string, endOfDay: boolean, timeZone = SITE_TIME_ZONE): string {
  const [y, m, d] = day.split("-").map(Number);
  const wallClock = endOfDay ? Date.UTC(y, m - 1, d, 23, 59, 59, 999) : Date.UTC(y, m - 1, d);
  const offset = zoneOffsetMs(new Date(wallClock), timeZone);
  return new Date(wallClock - offset).toISOString();
}
