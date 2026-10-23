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
 * Me gusta y visitas totales de una página de un listado del panel: dos
 * consultas por página (no una por fila). Las visitas son las ya volcadas a
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
        for (UUID id : ids) {
            result.put(id, new Counts(likeCounts.getOrDefault(id, 0L), viewCounts.getOrDefault(id, 0L)));
        }
        return result;
    }

    public record Counts(long likes, long views) {
    }
}
