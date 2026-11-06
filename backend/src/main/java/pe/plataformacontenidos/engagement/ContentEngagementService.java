package pe.plataformacontenidos.engagement;

import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import pe.plataformacontenidos.catalog.ContentType;

/**
 * Me gusta, visitas, reacciones y clics de afiliado de una página de un
 * listado del panel: una consulta por cifra y página (no una por fila). Las visitas son las ya volcadas a
 * la base (ContentViewFlushJob), así que pueden ir hasta un minuto atrás.
 */
@Service
public class ContentEngagementService {

    private final ContentLikeService likes;
    private final JdbcTemplate jdbc;

    public ContentEngagementService(ContentLikeService likes, JdbcTemplate jdbc) {
        this.likes = likes;
        this.jdbc = jdbc;
    }

    /** Un valor por id pedido (0 si no tiene). */
    public Map<UUID, Counts> countsFor(ContentType type, Collection<UUID> ids) {
        Map<UUID, Counts> result = new HashMap<>();
        if (ids.isEmpty()) {
            return result;
        }
        Map<UUID, Long> likeCounts = likes.countLikes(type, ids);
        Map<UUID, Long> viewCounts = new HashMap<>();
        List<UUID> idList = List.copyOf(ids);
        String placeholders = String.join(",", Collections.nCopies(idList.size(), "?"));
        Object[] params = new Object[idList.size() + 1];
        params[0] = type.name();
        for (int i = 0; i < idList.size(); i++) {
            params[i + 1] = idList.get(i);
        }
        jdbc.query("SELECT content_id, SUM(views) FROM engagement.content_views_daily"
                + " WHERE content_type = ? AND content_id IN (" + placeholders + ") GROUP BY content_id",
                rs -> {
                    viewCounts.put(rs.getObject(1, UUID.class), rs.getLong(2));
                }, params);
        Map<UUID, Long> reactionCounts = grouped("SELECT content_id, COUNT(*) FROM engagement.content_reactions"
                + " WHERE content_type = ? AND content_id IN (" + placeholders + ") GROUP BY content_id", params);
        // Clics en enlaces de afiliado (módulo affiliates): se lee la tabla, sin depender del módulo.
        Map<UUID, Long> affiliateClicks = grouped("SELECT content_id, SUM(clicks) FROM affiliates.affiliate_links"
                + " WHERE content_type = ? AND content_id IN (" + placeholders + ") GROUP BY content_id", params);
        for (UUID id : ids) {
            result.put(id, new Counts(likeCounts.getOrDefault(id, 0L), viewCounts.getOrDefault(id, 0L),
                    reactionCounts.getOrDefault(id, 0L), affiliateClicks.getOrDefault(id, 0L)));
        }
        return result;
    }

    private Map<UUID, Long> grouped(String sql, Object[] params) {
        Map<UUID, Long> counts = new HashMap<>();
        jdbc.query(sql, rs -> {
            counts.put(rs.getObject(1, UUID.class), rs.getLong(2));
        }, params);
        return counts;
    }

    /**
     * Cifras de una fila: me gusta, visitas, reacciones (😍 😂 😮 🙌 juntas) y
     * clics en sus enlaces de afiliado.
     */
    public record Counts(long likes, long views, long reactions, long affiliateClicks) {

        public Counts(long likes, long views) {
            this(likes, views, 0, 0);
        }
    }
}
