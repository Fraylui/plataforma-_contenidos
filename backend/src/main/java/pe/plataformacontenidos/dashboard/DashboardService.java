package pe.plataformacontenidos.dashboard;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.StringJoiner;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import pe.plataformacontenidos.dashboard.DashboardSummary.AdTotals;
import pe.plataformacontenidos.dashboard.DashboardSummary.ContentRow;
import pe.plataformacontenidos.dashboard.DashboardSummary.DailyPoint;
import pe.plataformacontenidos.dashboard.DashboardSummary.Kpi;
import pe.plataformacontenidos.dashboard.DashboardSummary.TopRow;
import pe.plataformacontenidos.engagement.ContentType;
import pe.plataformacontenidos.identity.permission.AccessLevel;
import pe.plataformacontenidos.identity.permission.Module;
import pe.plataformacontenidos.identity.permission.Permissions;

/**
 * Resumen del inicio del panel en una sola llamada (hoja de ruta F3). Antes
 * el inicio descargaba el contenido completo de los 5 tipos para mostrar 8
 * filas; ahora la base agrega y devuelve solo lo que se dibuja.
 *
 * <p>Es un modelo de lectura, como el feed (FeedCandidateCache): consulta
 * las tablas de los 5 tipos en modo lectura, nunca escribe en ellas.
 *
 * <p>Respeta los permisos: cada tipo entra solo si el usuario tiene ese
 * módulo (y entonces ve todo lo del módulo). Anuncios, solo con el módulo de
 * publicidad. Se guarda {@link #TTL} por período y combinación de módulos:
 * dos personas con los mismos módulos comparten el resultado.
 */
@Service
public class DashboardService {

    public static final Set<Integer> RANGES = Set.of(7, 30, 90);

    static final Duration TTL = Duration.ofSeconds(60);
    private static final int MAX_CACHED = 500;

    /** Tabla, columna de título y módulo de cada tipo; valores fijos, nunca vienen del usuario. */
    private record Source(String table, String titleColumn, Module module, String select) {

        Source(String table, String titleColumn, Module module) {
            this(table, titleColumn, module, null);
        }
    }

    /**
     * Episodios: su slug público es "serie/episodio" (/series/{serie}/{episodio}),
     * así "Lo más visto" puede enlazarlos. Llegan solos desde YouTube, por eso no
     * entran a "Contenido reciente" (lo llenarían).
     */
    private static final String EPISODE_SELECT = "SELECT 'EPISODE'::text AS type, e.id, e.title AS title,"
            + " s.slug || '/' || e.slug AS slug, e.status, e.created_at, e.published_at"
            + " FROM series.episodes e JOIN series.series s ON s.id = e.series_id";

    private static final Map<ContentType, Source> SOURCES = new EnumMap<>(Map.of(
            ContentType.PUBLICATION, new Source("content.publications", "title", Module.PUBLICATIONS),
            ContentType.PLACE, new Source("places.places", "name", Module.PLACES),
            ContentType.CELEBRATION, new Source("celebrations.celebrations", "title", Module.CELEBRATIONS),
            ContentType.GALLERY, new Source("galleries.galleries", "title", Module.GALLERIES),
            ContentType.EPISODE, new Source("series.episodes", "title", Module.SERIES, EPISODE_SELECT)));

    private record CacheEntry(Instant builtAt, DashboardSummary summary) {
    }

    private final JdbcTemplate jdbc;
    private final ZoneId siteZone;
    private final Clock clock;
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    @Autowired
    public DashboardService(JdbcTemplate jdbc, @Value("${site.time-zone:America/Lima}") String siteTimeZone) {
        this(jdbc, ZoneId.of(siteTimeZone), Clock.systemUTC());
    }

    DashboardService(JdbcTemplate jdbc, ZoneId siteZone, Clock clock) {
        this.jdbc = jdbc;
        this.siteZone = siteZone;
        this.clock = clock;
    }

    public DashboardSummary summary(Permissions permissions, int rangeDays) {
        if (!RANGES.contains(rangeDays)) {
            throw new InvalidDashboardRangeException(rangeDays);
        }
        Scope scope = Scope.of(permissions);
        String key = rangeDays + "|" + scope.signature();
        CacheEntry cached = cache.get(key);
        Instant now = clock.instant();
        if (cached != null && cached.builtAt().plus(TTL).isAfter(now)) {
            return cached.summary();
        }
        DashboardSummary summary = build(scope, rangeDays);
        if (cache.size() >= MAX_CACHED) {
            cache.clear();
        }
        cache.put(key, new CacheEntry(now, summary));
        return summary;
    }

    private DashboardSummary build(Scope scope, int rangeDays) {
        LocalDate today = LocalDate.now(clock.withZone(siteZone));
        LocalDate from = today.minusDays(rangeDays - 1L);
        LocalDate previousFrom = from.minusDays(rangeDays);
        Timestamp previousFromInstant = Timestamp.from(previousFrom.atStartOfDay(siteZone).toInstant());

        Map<LocalDate, Long> views = Map.of();
        Map<LocalDate, Long> likes = Map.of();
        Map<LocalDate, Long> published = Map.of();
        List<TopRow> topViewed = List.of();
        Map<ContentType, Map<String, Long>> byTypeAndStatus = new EnumMap<>(ContentType.class);
        List<ContentRow> recent = List.of();

        if (!scope.types().isEmpty()) {
            String cte = scope.cte();
            views = daily(cte + """
                    SELECT v.day, SUM(v.views) FROM engagement.content_views_daily v
                      JOIN scoped s ON s.type = v.content_type AND s.id = v.content_id
                     WHERE v.day >= ? GROUP BY v.day
                    """, Date.valueOf(previousFrom));
            likes = daily(cte + """
                    SELECT (l.created_at AT TIME ZONE ?)::date AS d, COUNT(*) FROM engagement.content_likes l
                      JOIN scoped s ON s.type = l.content_type AND s.id = l.content_id
                     WHERE l.created_at >= ? GROUP BY d
                    """, siteZone.getId(), previousFromInstant);
            published = daily(cte + """
                    SELECT (published_at AT TIME ZONE ?)::date AS d, COUNT(*) FROM scoped
                     WHERE status = 'PUBLISHED' AND published_at >= ? GROUP BY d
                    """, siteZone.getId(), previousFromInstant);
            topViewed = jdbc.query(cte + """
                    SELECT s.type, s.id, s.title, s.slug, SUM(v.views) AS total
                      FROM engagement.content_views_daily v
                      JOIN scoped s ON s.type = v.content_type AND s.id = v.content_id
                     WHERE v.day >= ?
                     GROUP BY s.type, s.id, s.title, s.slug
                     ORDER BY total DESC, s.title
                     LIMIT 10
                    """, (rs, i) -> new TopRow(ContentType.valueOf(rs.getString(1)), rs.getObject(2, UUID.class),
                    rs.getString(3), rs.getString(4), rs.getLong(5)), Date.valueOf(from));
            jdbc.query(cte + "SELECT type, status, COUNT(*) FROM scoped GROUP BY type, status", rs -> {
                byTypeAndStatus.computeIfAbsent(ContentType.valueOf(rs.getString(1)), t -> new LinkedHashMap<>())
                        .put(rs.getString(2), rs.getLong(3));
            });
            recent = rows(cte + """
                    SELECT type, id, title, status, created_at FROM scoped WHERE type <> 'EPISODE'
                     ORDER BY created_at DESC LIMIT 8
                    """);
        }

        AdTotals ads = scope.ads() ? adTotals(from, previousFrom) : null;

        List<DailyPoint> series = new ArrayList<>(rangeDays);
        for (LocalDate day = from; !day.isAfter(today); day = day.plusDays(1)) {
            series.add(new DailyPoint(day.toString(), views.getOrDefault(day, 0L), likes.getOrDefault(day, 0L),
                    published.getOrDefault(day, 0L)));
        }
        return new DashboardSummary(rangeDays, from.toString(), today.toString(),
                kpi(views, from, previousFrom), kpi(likes, from, previousFrom), kpi(published, from, previousFrom),
                series, topViewed, byTypeAndStatus, recent, ads);
    }

    private AdTotals adTotals(LocalDate from, LocalDate previousFrom) {
        long[] totals = new long[4];
        // Las cifras diarias de anuncios se guardan por día UTC (CampaignService): diferencia de horas, no de días.
        jdbc.query("""
                SELECT day >= ? AS current_period, SUM(impressions), SUM(clicks) FROM advertising.campaign_daily_stats
                 WHERE day >= ? GROUP BY 1
                """, rs -> {
            int offset = rs.getBoolean(1) ? 0 : 2;
            totals[offset] = rs.getLong(2);
            totals[offset + 1] = rs.getLong(3);
        }, Date.valueOf(from), Date.valueOf(previousFrom));
        return new AdTotals(totals[0], totals[1], totals[2], totals[3]);
    }

    private Map<LocalDate, Long> daily(String sql, Object... params) {
        Map<LocalDate, Long> result = new HashMap<>();
        jdbc.query(sql, rs -> {
            result.put(rs.getDate(1).toLocalDate(), rs.getLong(2));
        }, params);
        return result;
    }

    private List<ContentRow> rows(String sql, Object... params) {
        return jdbc.query(sql, (rs, i) -> new ContentRow(ContentType.valueOf(rs.getString(1)),
                rs.getObject(2, UUID.class), rs.getString(3), rs.getString(4),
                rs.getTimestamp(5).toInstant()), params);
    }

    private static Kpi kpi(Map<LocalDate, Long> daily, LocalDate from, LocalDate previousFrom) {
        long current = 0;
        long previous = 0;
        for (Map.Entry<LocalDate, Long> entry : daily.entrySet()) {
            if (!entry.getKey().isBefore(from)) {
                current += entry.getValue();
            } else if (!entry.getKey().isBefore(previousFrom)) {
                previous += entry.getValue();
            }
        }
        return new Kpi(current, previous);
    }

    /** Tipos visibles (un módulo de contenido = todo su contenido); arma la CTE "scoped". */
    private record Scope(Set<ContentType> types, boolean ads) {

        static Scope of(Permissions permissions) {
            Set<ContentType> types = EnumSet.noneOf(ContentType.class);
            SOURCES.forEach((type, source) -> {
                if (permissions.can(source.module(), AccessLevel.PUBLISH)) {
                    types.add(type);
                }
            });
            return new Scope(types, permissions.can(Module.ADVERTISING, AccessLevel.ACCESS));
        }

        String signature() {
            return types + (ads ? "|ads" : "");
        }

        String cte() {
            StringJoiner union = new StringJoiner(" UNION ALL ", "WITH scoped AS (", ") ");
            for (ContentType type : types) {
                Source source = SOURCES.get(type);
                union.add(source.select() != null ? source.select()
                        : "SELECT '" + type + "'::text AS type, id, " + source.titleColumn() + " AS title, slug, status,"
                                + " created_at, published_at FROM " + source.table());
            }
            return union.toString();
        }
    }
}
