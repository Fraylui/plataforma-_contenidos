import { SITE_TIME_ZONE } from "@/lib/site-time-zone";

/** Duración supuesta cuando el evento no tiene hora de fin. */
const DEFAULT_DURATION_MS = 2 * 3600_000;

export interface CalendarEvent {
  title: string;
  startsAt: string;
  endsAt?: string | null;
  url: string;
  location?: string | null;
  /** Todo el día: fecha sin hora (en la zona del sitio). */
  allDay?: boolean;
  /** Se repite cada año (28 de julio): el calendario la agenda para siempre. */
  recursYearly?: boolean;
}

/** 2030-01-10 en la zona del sitio → 20300110 (fecha sin hora, RFC 5545). */
function dateStamp(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(date)
    .replace(/-/g, "");
}

/** 2030-01-10T19:00:00.000Z → 20300110T190000Z (formato de Google Calendar e iCalendar). */
function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Enlaces para «Recordarme» una celebración: Google Calendar (abre en el navegador) y
 * un .ics (RFC 5545) para Apple Calendar / Outlook. Siempre en UTC: cada
 * calendario lo muestra en la zona horaria de quien lo agrega.
 */
export function calendarLinks(event: CalendarEvent): { google: string; ics: string } {
  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + DEFAULT_DURATION_MS);
  // Todo el día: DTEND es el día siguiente (exclusivo), como piden Google e iCalendar.
  const startStamp = event.allDay ? dateStamp(start) : utcStamp(start);
  const endStamp = event.allDay ? dateStamp(new Date(start.getTime() + 86_400_000)) : utcStamp(end);
  const yearly = "RRULE:FREQ=YEARLY";

  const google = new URL("https://calendar.google.com/calendar/render");
  google.searchParams.set("action", "TEMPLATE");
  google.searchParams.set("text", event.title);
  google.searchParams.set("dates", `${startStamp}/${endStamp}`);
  google.searchParams.set("details", event.url);
  if (event.location) google.searchParams.set("location", event.location);
  if (event.recursYearly) google.searchParams.set("recur", yearly);

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//plataforma//celebraciones//ES",
    "BEGIN:VEVENT",
    `UID:${utcStamp(start)}-${encodeURIComponent(event.url)}`,
    `DTSTAMP:${utcStamp(new Date())}`,
    event.allDay ? `DTSTART;VALUE=DATE:${startStamp}` : `DTSTART:${startStamp}`,
    event.allDay ? `DTEND;VALUE=DATE:${endStamp}` : `DTEND:${endStamp}`,
    ...(event.recursYearly ? [yearly] : []),
    `SUMMARY:${event.title.replace(/[,;\\]/g, (c) => `\\${c}`)}`,
    ...(event.location ? [`LOCATION:${event.location.replace(/[,;\\]/g, (c) => `\\${c}`)}`] : []),
    `URL:${event.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return { google: google.toString(), ics: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}` };
}
