/** Duración supuesta cuando el evento no tiene hora de fin. */
const DEFAULT_DURATION_MS = 2 * 3600_000;

export interface CalendarEvent {
  title: string;
  startsAt: string;
  endsAt?: string | null;
  url: string;
  location?: string | null;
}

/** 2030-01-10T19:00:00.000Z → 20300110T190000Z (formato de Google Calendar e iCalendar). */
function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Enlaces para "Agendar" un evento: Google Calendar (abre en el navegador) y
 * un .ics (RFC 5545) para Apple Calendar / Outlook. Siempre en UTC: cada
 * calendario lo muestra en la zona horaria de quien lo agrega.
 */
export function calendarLinks(event: CalendarEvent): { google: string; ics: string } {
  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + DEFAULT_DURATION_MS);

  const google = new URL("https://calendar.google.com/calendar/render");
  google.searchParams.set("action", "TEMPLATE");
  google.searchParams.set("text", event.title);
  google.searchParams.set("dates", `${utcStamp(start)}/${utcStamp(end)}`);
  google.searchParams.set("details", event.url);
  if (event.location) google.searchParams.set("location", event.location);

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//plataforma//agenda//ES",
    "BEGIN:VEVENT",
    `UID:${utcStamp(start)}-${encodeURIComponent(event.url)}`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${utcStamp(start)}`,
    `DTEND:${utcStamp(end)}`,
    `SUMMARY:${event.title.replace(/[,;\\]/g, (c) => `\\${c}`)}`,
    ...(event.location ? [`LOCATION:${event.location.replace(/[,;\\]/g, (c) => `\\${c}`)}`] : []),
    `URL:${event.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return { google: google.toString(), ics: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}` };
}
