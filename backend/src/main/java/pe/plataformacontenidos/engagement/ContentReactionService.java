package pe.plataformacontenidos.engagement;

import java.util.Collection;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.plataformacontenidos.catalog.ContentLookup;
import pe.plataformacontenidos.catalog.ContentType;

/**
 * Reacciones de lectores anónimos: una por visitante y contenido, que se
 * cambia o se quita (como en Facebook). Solo en contenido publicado.
 * Escritura atómica (INSERT … ON CONFLICT) para que un doble toque no falle.
 */
@Service
public class ContentReactionService {

    /** Tipos con página propia donde se reacciona. */
    public static final Set<ContentType> TYPES = Set.of(ContentType.PUBLICATION, ContentType.PLACE,
            ContentType.CELEBRATION, ContentType.GALLERY, ContentType.EPISODE);

    public record Reactions(Map<Reaction, Long> counts, Reaction mine) {
    }

    private final JdbcTemplate jdbc;
    private final ContentLookup lookup;

    public ContentReactionService(JdbcTemplate jdbc, ContentLookup lookup) {
        this.jdbc = jdbc;
        this.lookup = lookup;
    }

    /** Vacío si el contenido no existe, no está publicado o su tipo no admite reacciones. */
    public Optional<Reactions> get(ContentType type, UUID contentId, UUID visitorId) {
        if (!available(type, contentId)) {
            return Optional.empty();
        }
        return Optional.of(read(type, contentId, visitorId));
    }

    /** {@code reaction} null quita la reacción del visitante. */
    @Transactional
    public Optional<Reactions> react(ContentType type, UUID contentId, UUID visitorId, Reaction reaction) {
        if (visitorId == null || !available(type, contentId)) {
            return Optional.empty();
        }
        if (reaction == null) {
            jdbc.update("DELETE FROM engagement.content_reactions WHERE content_type = ? AND content_id = ? AND visitor_id = ?",
                    type.name(), contentId, visitorId);
        } else {
            jdbc.update("""
                    INSERT INTO engagement.content_reactions (content_type, content_id, visitor_id, reaction)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT (content_type, content_id, visitor_id)
                    DO UPDATE SET reaction = EXCLUDED.reaction, created_at = now()
                    """, type.name(), contentId, visitorId, reaction.name());
        }
        return Optional.of(read(type, contentId, visitorId));
    }

    private boolean available(ContentType type, UUID contentId) {
        return type != null && TYPES.contains(type) && contentId != null && lookup.find(type, contentId).isPresent();
    }

    private Reactions read(ContentType type, UUID contentId, UUID visitorId) {
        Map<Reaction, Long> counts = new EnumMap<>(Reaction.class);
        for (Reaction reaction : Reaction.values()) {
            counts.put(reaction, 0L);
        }
        jdbc.query("""
                SELECT reaction, COUNT(*) FROM engagement.content_reactions
                 WHERE content_type = ? AND content_id = ? GROUP BY reaction
                """, rs -> {
            counts.put(Reaction.valueOf(rs.getString(1)), rs.getLong(2));
        }, type.name(), contentId);
        Reaction mine = visitorId == null ? null : jdbc.query("""
                SELECT reaction FROM engagement.content_reactions
                 WHERE content_type = ? AND content_id = ? AND visitor_id = ?
                """, (rs, n) -> Reaction.valueOf(rs.getString(1)), type.name(), contentId, visitorId)
                .stream().findFirst().orElse(null);
        return new Reactions(counts, mine);
    }

    /**
     * Conteos de varios contenidos en una sola consulta (tarjetas del feed).
     * Solo aparecen los que tienen al menos una reacción.
     */
    public Map<UUID, Map<Reaction, Long>> countsFor(Collection<UUID> contentIds) {
        Map<UUID, Map<Reaction, Long>> result = new HashMap<>();
        if (contentIds == null || contentIds.isEmpty()) {
            return result;
        }
        jdbc.query("""
                SELECT content_id, reaction, COUNT(*) FROM engagement.content_reactions
                 WHERE content_id = ANY(?) GROUP BY content_id, reaction
                """, ps -> ps.setArray(1, ps.getConnection().createArrayOf("uuid", contentIds.toArray())), rs -> {
            result.computeIfAbsent(rs.getObject(1, UUID.class), id -> new EnumMap<>(Reaction.class))
                    .put(Reaction.valueOf(rs.getString(2)), rs.getLong(3));
        });
        return result;
    }
}
