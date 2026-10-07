import { describe, expect, it } from "vitest";
import { calendarLinks } from "./calendar-link";

describe("calendarLinks", () => {
  const event = { title: "Feria de Santa Ana", startsAt: "2030-01-10T19:00:00Z", url: "https://ecos.example/eventos/feria" };

  it("Google Calendar con fechas en UTC y 2 h de duración por defecto", () => {
    const { google } = calendarLinks(event);
    const url = new URL(google);
    expect(url.hostname).toBe("calendar.google.com");
    expect(url.searchParams.get("text")).toBe("Feria de Santa Ana");
    expect(url.searchParams.get("dates")).toBe("20300110T190000Z/20300110T210000Z");
  });

  it(".ics con DTSTART en UTC y el enlace del evento", () => {
    const ics = decodeURIComponent(calendarLinks(event).ics.replace("data:text/calendar;charset=utf-8,", ""));
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART:20300110T190000Z");
    expect(ics).toContain("DTEND:20300110T210000Z");
    expect(ics).toContain("URL:https://ecos.example/eventos/feria");
  });
});
