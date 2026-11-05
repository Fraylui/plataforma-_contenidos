package pe.plataformacontenidos.dashboard;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import pe.plataformacontenidos.catalog.ContentRegistry;
import pe.plataformacontenidos.catalog.ContentSource;
import pe.plataformacontenidos.catalog.ContentType;
import pe.plataformacontenidos.identity.permission.AccessLevel;
import pe.plataformacontenidos.identity.permission.Permissions;

/**
 * Calendario de publicaciones del panel: en un mes, qué se publicó, qué está
 * programado y qué fechas de Celebraciones caen, para preparar el contenido
 * antes del día y no el mismo día.
 *
 * <p>Modelo de lectura como {@link DashboardService}: solo lee las tablas de
 * los tipos que se crean en el panel y entran al Inicio (publicaciones,
 * lugares, celebraciones, galerías), y cada tipo solo si el usuario tiene su
 * módulo. Las celebraciones que se repiten cada año aparecen en su día del
 * mes pedido, sea cual sea el año en que se cargaron.
 */
@Service
public class CalendarService {

    /** Rango que se acepta: suficiente para planear, acotado para no recorrer años enteros. */
    static final YearMonth MIN = YearMonth.of(2000, 1);
    static final YearMonth MAX = YearMonth.of(2100, 12);
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");

    public enum Kind { PUBLISHED, SCHEDULED, CELEBRATION_DATE }

    /**
     * Una entrada del calendario.
     *
     * @param date día (yyyy-MM-dd) en la zona del sitio
     * @param time hora (HH:mm) de publicación o programación; null en las fechas de celebración
     */
    public record Entry(Kind kind, ContentType type, UUID id, String title, String status, String date, String time) {
    }

    public record Month(String month, List<Entry> entries) {
    }

    private final JdbcTemplate jdbc;
    private final ContentRegistry contents;
    private final ZoneId siteZone;
    private final Clock clock;

    @Autowired
    public CalendarService(JdbcTemplate jdbc, ContentRegistry contents,
            @Value("${site.time-zone:America/Lima}") String siteTimeZone) {
        this(jdbc, contents, ZoneId.of(siteTimeZone), Clock.systemUTC());
    }

    CalendarService(JdbcTemplate jdbc, ContentRegistry contents, ZoneId siteZone, Clock clock) {
        this.jdbc = jdbc;
        this.contents = contents;
        this.siteZone = siteZone;
        this.clock = clock;
    }

    /** {@code month} en formato yyyy-MM; null o vacío = el mes actual en la zona del sitio. */
    public Month month(Permissions permissions, String month) {
        YearMonth ym = parse(month);
        Timestamp from = Timestamp.from(ym.atDay(1).atStartOfDay(siteZone).toInstant());
        Timestamp to = Timestamp.from(ym.plusMonths(1).atDay(1).atStartOfDay(siteZone).toInstant());

        List<Entry> entries = new ArrayList<>();
        for (ContentSource source : contents.where(s -> s.type() != null && s.inDashboard() && s.createdInPanel())) {
            if (!permissions.can(source.module(), AccessLevel.PUBLISH)) {
                continue;
            }
            // Nombres de tabla y columna validados como identificadores en ContentSource; nunca del usuario.
            jdbc.query("SELECT id, " + source.titleColumn() + ", status, scheduled_at, published_at FROM "
                    + source.table() + " " + """
                     WHERE (status = 'SCHEDULED' AND scheduled_at >= ? AND scheduled_at < ?)
                        OR (status = 'PUBLISHED' AND published_at >= ? AND published_at < ?)
                    """, rs -> {
                String status = rs.getString(3);
                boolean scheduled = "SCHEDULED".equals(status);
                Timestamp at = rs.getTimestamp(scheduled ? 4 : 5);
                ZonedDateTime local = at.toInstant().atZone(siteZone);
                entries.add(new Entry(scheduled ? Kind.SCHEDULED : Kind.PUBLISHED, source.type(),
                        rs.getObject(1, UUID.class), rs.getString(2), status, local.toLocalDate().toString(),
                        local.format(TIME)));
            }, from, to, from, to);

            if (source.type() == ContentType.CELEBRATION) {
                entries.addAll(celebrationDates(ym, from, to));
            }
        }
        entries.sort(Comparator.comparing(Entry::date)
                .thenComparing(entry -> entry.time() == null ? "" : entry.time())
                .thenComparing(Entry::title, Comparator.nullsLast(Comparator.naturalOrder())));
        return new Month(ym.toString(), entries);
    }

    /** Días del mes en que cae cada celebración (las que se repiten, en su día de este año). */
    private List<Entry> celebrationDates(YearMonth ym, Timestamp from, Timestamp to) {
        List<Entry> dates = new ArrayList<>();
        jdbc.query("""
                SELECT id, title, status, starts_at, recurs_yearly FROM celebrations.celebrations
                 WHERE status <> 'ARCHIVED'
                   AND ((recurs_yearly AND EXTRACT(MONTH FROM starts_at AT TIME ZONE ?) = ?)
                     OR (NOT recurs_yearly AND starts_at >= ? AND starts_at < ?))
                """, rs -> {
            LocalDate start = rs.getTimestamp(4).toInstant().atZone(siteZone).toLocalDate();
            int day = start.getDayOfMonth();
            if (rs.getBoolean(5) && day > ym.lengthOfMonth()) {
                day = ym.lengthOfMonth(); // 29 de febrero en un año no bisiesto: el 28
            }
            LocalDate date = rs.getBoolean(5) ? ym.atDay(day) : start;
            dates.add(new Entry(Kind.CELEBRATION_DATE, ContentType.CELEBRATION, rs.getObject(1, UUID.class),
                    rs.getString(2), rs.getString(3), date.toString(), null));
        }, siteZone.getId(), ym.getMonthValue(), from, to);
        return dates;
    }

    private YearMonth parse(String month) {
        if (month == null || month.isBlank()) {
            return YearMonth.from(Instant.now(clock).atZone(siteZone));
        }
        YearMonth ym;
        try {
            ym = YearMonth.parse(month);
        } catch (RuntimeException ex) {
            throw new InvalidCalendarMonthException(month);
        }
        if (ym.isBefore(MIN) || ym.isAfter(MAX)) {
            throw new InvalidCalendarMonthException(month);
        }
        return ym;
    }
}
