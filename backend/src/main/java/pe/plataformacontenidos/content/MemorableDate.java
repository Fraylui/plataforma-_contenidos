package pe.plataformacontenidos.content;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.MonthDay;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;

/**
 * Fecha memorable de un contenido para "Un día como hoy" (CONTEXTO.md 1.1):
 * día y mes que se repiten cada año y, si se conoce, el año original
 * (para mostrar "hace 202 años"). El 29 de febrero se acepta; en años no
 * bisiestos se celebra el 28 (ver {@link #upcomingKeys}).
 */
public record MemorableDate(Integer year, int month, int day) {

    public MemorableDate {
        MonthDay monthDay;
        try {
            monthDay = MonthDay.of(month, day);
        } catch (DateTimeException e) {
            throw new InvalidMemorableDateException("La fecha memorable no existe: día " + day + ", mes " + month);
        }
        if (year != null) {
            if (year < 1 || year > 9999) {
                throw new InvalidMemorableDateException("El año de la fecha memorable debe estar entre 1 y 9999");
            }
            if (!monthDay.isValidYear(year)) {
                throw new InvalidMemorableDateException("El " + day + "/" + month + " no existe en el año " + year);
            }
        }
    }

    /**
     * Arma la fecha desde los campos sueltos del formulario: sin día ni mes
     * (ni año) no hay fecha; con uno solo de los dos es un error, no se
     * adivina el otro.
     */
    public static MemorableDate fromParts(Integer year, Integer month, Integer day) {
        if (month == null && day == null) {
            if (year != null) {
                throw new InvalidMemorableDateException("Para usar el año, indica también el día y el mes");
            }
            return null;
        }
        if (month == null || day == null) {
            throw new InvalidMemorableDateException("Indica el día y el mes de la fecha memorable");
        }
        return new MemorableDate(year, month, day);
    }

    /** Clave mes*100+día (9 de diciembre → 1209), la misma que usa la consulta del repositorio. */
    public int key() {
        return month * 100 + day;
    }

    /** Años transcurridos al llegar la fecha en {@code occurrence}; null si no se conoce el año original. */
    public Integer yearsAgo(LocalDate occurrence) {
        return year == null ? null : occurrence.getYear() - year;
    }

    /**
     * Claves (mes*100+día) de los próximos {@code days} días desde
     * {@code from}, en orden, con cuántos días faltan para cada una. En un
     * año no bisiesto el 28 de febrero también trae lo del 29.
     */
    public static List<KeyOffset> upcomingKeys(LocalDate from, int days) {
        List<KeyOffset> keys = new ArrayList<>();
        for (int offset = 0; offset < days; offset++) {
            LocalDate date = from.plusDays(offset);
            keys.add(new KeyOffset(date.getMonthValue() * 100 + date.getDayOfMonth(), offset, date));
            if (date.getMonthValue() == 2 && date.getDayOfMonth() == 28 && !Year.isLeap(date.getYear())) {
                keys.add(new KeyOffset(229, offset, date));
            }
        }
        return keys;
    }

    /** Una clave de fecha, a cuántos días está y qué día del calendario cae. */
    public record KeyOffset(int key, int daysUntil, LocalDate occurrence) {
    }
}
