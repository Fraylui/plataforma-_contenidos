package pe.plataformacontenidos.events;

import java.time.Instant;
import java.time.LocalDate;
import java.time.MonthDay;
import java.time.ZoneId;
import java.time.ZonedDateTime;

/**
 * Cuándo «toca» la próxima vez una Fecha de la Agenda (spec 2026-10-16):
 * una única es su propia fecha; una que se repite cada año (28 de julio,
 * Batalla de Ayacucho) vuelve este año si su día aún no pasó — el mismo día
 * cuenta como hoy — y si no, el año siguiente. El 29 de febrero cae el 28
 * en años no bisiestos. Todo en la zona del sitio (Lima), no en UTC: a las
 * 8 p. m. del 27 de julio en Lima ya es 28 en UTC.
 */
public final class NextOccurrence {

    private NextOccurrence() {
    }

    public static Instant of(Instant startsAt, boolean recursYearly, boolean allDay, ZoneId zone, LocalDate today) {
        if (!recursYearly) {
            return startsAt;
        }
        ZonedDateTime original = startsAt.atZone(zone);
        MonthDay monthDay = MonthDay.from(original);
        LocalDate candidate = monthDay.atYear(today.getYear());
        if (candidate.isBefore(today)) {
            candidate = monthDay.atYear(today.getYear() + 1);
        }
        ZonedDateTime next = allDay
                ? candidate.atStartOfDay(zone)
                : candidate.atTime(original.toLocalTime()).atZone(zone);
        return next.toInstant();
    }

    public static Instant startOfDay(LocalDate day, ZoneId zone) {
        return day.atStartOfDay(zone).toInstant();
    }
}
