package pe.plataformacontenidos.engagement;

import java.sql.Date;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Vuelca las visitas acumuladas en Redis ({@link ContentViewCounter}) a
 * engagement.content_views_daily cada minuto: una escritura por contenido y
 * día en vez de una por visita. Solo guarda visitas de contenido que existe y
 * está publicado — un id inventado se descarta aquí, no en cada visita.
 *
 * El hash pendiente se renombra antes de leerlo, así las visitas que llegan
 * durante el volcado van a un hash nuevo y no se pierden. Si la base falla,
 * el hash renombrado queda y se reintenta en la próxima pasada.
 *
 * Retención: cada día a las 03:40 borra los días anteriores a
 * VIEWS_RETENTION_DAYS (por defecto 730; las cifras son totales anónimos).
 */
@Component
public class ContentViewFlushJob {

    static final String FLUSHING_KEY = "views:flushing";

    private static final Logger log = LoggerFactory.getLogger(ContentViewFlushJob.class);

    /** Tabla de cada tipo; valores fijos, nunca vienen del usuario. */
    private static final Map<ContentType, String> TABLES = new EnumMap<>(Map.of(
            ContentType.ARTICLE, "content.articles",
            ContentType.PLACE, "places.places",
            ContentType.EVENT, "events.events",
            ContentType.GALLERY, "galleries.galleries",
            ContentType.BUSINESS, "directory.businesses"));

    private final StringRedisTemplate redis;
    private final JdbcTemplate jdbc;
    private final int retentionDays;
    private final ZoneId siteZone;

    public ContentViewFlushJob(StringRedisTemplate redis, JdbcTemplate jdbc,
            @Value("${engagement.views-retention-days:730}") int retentionDays,
            @Value("${site.time-zone:America/Lima}") String siteTimeZone) {
        this.redis = redis;
        this.jdbc = jdbc;
        this.retentionDays = retentionDays;
        this.siteZone = ZoneId.of(siteTimeZone);
    }

    @Scheduled(fixedDelayString = "${engagement.views-flush-ms:60000}",
            initialDelayString = "${engagement.views-flush-ms:60000}")
    @Transactional
    public void flush() {
        if (!Boolean.TRUE.equals(redis.hasKey(FLUSHING_KEY))) {
            if (!Boolean.TRUE.equals(redis.hasKey(ContentViewCounter.PENDING_KEY))) {
                return;
            }
            redis.rename(ContentViewCounter.PENDING_KEY, FLUSHING_KEY);
        }
        Map<Object, Object> entries = redis.opsForHash().entries(FLUSHING_KEY);
        Map<ContentType, List<Object[]>> byType = new EnumMap<>(ContentType.class);
        entries.forEach((field, count) -> {
            String[] parts = field.toString().split("\\|");
            try {
                ContentType type = ContentType.valueOf(parts[1]);
                UUID id = UUID.fromString(parts[2]);
                byType.computeIfAbsent(type, t -> new ArrayList<>())
                        .add(new Object[] {Date.valueOf(LocalDate.parse(parts[0])), type.name(), id,
                            Long.parseLong(count.toString()), id});
            } catch (RuntimeException e) {
                log.warn("Visita pendiente con formato inválido descartada: {}", field);
            }
        });
        byType.forEach((type, rows) -> jdbc.batchUpdate("""
                INSERT INTO engagement.content_views_daily (day, content_type, content_id, views)
                SELECT ?, ?, ?, ?
                 WHERE EXISTS (SELECT 1 FROM %s WHERE id = ? AND status = 'PUBLISHED')
                ON CONFLICT (day, content_type, content_id) DO UPDATE
                   SET views = engagement.content_views_daily.views + EXCLUDED.views
                """.formatted(TABLES.get(type)), rows));
        redis.delete(FLUSHING_KEY);
    }

    @Scheduled(cron = "0 40 3 * * *", zone = "${site.time-zone:America/Lima}")
    public void purgeOld() {
        int deleted = jdbc.update("DELETE FROM engagement.content_views_daily WHERE day < ?",
                Date.valueOf(LocalDate.now(siteZone).minusDays(retentionDays)));
        if (deleted > 0) {
            log.info("Retención de visitas: {} filas anteriores a {} días borradas", deleted, retentionDays);
        }
    }
}
