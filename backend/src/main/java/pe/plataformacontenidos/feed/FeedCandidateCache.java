package pe.plataformacontenidos.feed;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import pe.plataformacontenidos.engagement.ContentType;
import pe.plataformacontenidos.feed.api.dto.FeedItemResponse;

/**
 * Candidatos del feed en memoria. Son los mismos para todos los visitantes
 * (el orden por semilla y lo ya visto se aplican después), así que no se
 * reconstruyen en cada petición: la simulación de carga (2026-10-07) mostró
 * que eso limitaba el backend a ~100 peticiones/s.
 *
 * <p>Siempre fresco ante cambios de contenido: cada petición consulta una
 * sola "versión" (la última modificación de los 5 tipos) y si cambió —
 * publicar, editar, archivar, programación cumplida— se reconstruye en el
 * acto. Lo que no toca esa versión (contadores de "me gusta", eventos que
 * terminan) se refresca a lo sumo cada {@link #MAX_AGE}.
 */
@Component
class FeedCandidateCache {

    static final Duration MAX_AGE = Duration.ofSeconds(30);

    private static final String CONTENT_VERSION_SQL = "select greatest("
            + "(select max(updated_at) from content.articles),"
            + " (select max(updated_at) from places.places),"
            + " (select max(updated_at) from events.events),"
            + " (select max(updated_at) from galleries.galleries),"
            + " (select max(updated_at) from directory.businesses))";

    private record Entry(Optional<Instant> version, Instant builtAt, List<FeedItemResponse> candidates) {
    }

    private final JdbcTemplate jdbcTemplate;
    private final Clock clock;
    private final Map<String, Entry> entries = new ConcurrentHashMap<>();

    @Autowired
    FeedCandidateCache(JdbcTemplate jdbcTemplate) {
        this(jdbcTemplate, Clock.systemUTC());
    }

    FeedCandidateCache(JdbcTemplate jdbcTemplate, Clock clock) {
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
    }

    /** Candidatos de {@code type} (null = todos los tipos); {@code builder} solo corre si hace falta reconstruir. */
    List<FeedItemResponse> candidates(ContentType type, Supplier<List<FeedItemResponse>> builder) {
        String key = type == null ? "ALL" : type.name();
        Optional<Instant> version = contentVersion();
        Entry entry = entries.get(key);
        if (isFresh(entry, version)) {
            return entry.candidates();
        }
        // Una sola reconstrucción a la vez: con 200 visitantes simultáneos no se reconstruye 200 veces.
        synchronized (this) {
            entry = entries.get(key);
            if (isFresh(entry, version)) {
                return entry.candidates();
            }
            Entry rebuilt = new Entry(version, clock.instant(), List.copyOf(builder.get()));
            entries.put(key, rebuilt);
            return rebuilt.candidates();
        }
    }

    private boolean isFresh(Entry entry, Optional<Instant> version) {
        return entry != null && entry.version().equals(version)
                && entry.builtAt().plus(MAX_AGE).isAfter(clock.instant());
    }

    private Optional<Instant> contentVersion() {
        Timestamp latest = jdbcTemplate.queryForObject(CONTENT_VERSION_SQL, Timestamp.class);
        return Optional.ofNullable(latest).map(Timestamp::toInstant);
    }
}
