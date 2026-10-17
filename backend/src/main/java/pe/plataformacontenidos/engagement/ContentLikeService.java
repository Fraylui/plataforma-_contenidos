package pe.plataformacontenidos.engagement;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Un solo "me gusta" genérico para los 6 tipos de contenido — ver ContentLike/ContentType. */
@Service
@Transactional
public class ContentLikeService {

    private final ContentLikeRepository contentLikeRepository;

    public ContentLikeService(ContentLikeRepository contentLikeRepository) {
        this.contentLikeRepository = contentLikeRepository;
    }

    public long countLikes(ContentType type, UUID contentId) {
        return contentLikeRepository.countByContentTypeAndContentId(type, contentId);
    }

    /** Conteos por id para un listado (los ids sin "me gusta" no aparecen en el mapa: usar getOrDefault(id, 0L)). */
    public Map<UUID, Long> countLikes(ContentType type, Collection<UUID> contentIds) {
        Map<UUID, Long> counts = new HashMap<>();
        if (contentIds.isEmpty()) {
            return counts;
        }
        for (Object[] row : contentLikeRepository.countGroupedByContentId(type, contentIds)) {
            counts.put((UUID) row[0], (Long) row[1]);
        }
        return counts;
    }

    /** "Me gusta" recibidos desde `since`, por id (sin entrada = 0). */
    public Map<UUID, Long> countLikesSince(ContentType type, Collection<UUID> contentIds, java.time.Instant since) {
        Map<UUID, Long> counts = new HashMap<>();
        if (contentIds.isEmpty()) {
            return counts;
        }
        for (Object[] row : contentLikeRepository.countGroupedByContentIdSince(type, contentIds, since)) {
            counts.put((UUID) row[0], (Long) row[1]);
        }
        return counts;
    }

    /** Alterna el "me gusta" de un lector anónimo. Devuelve el nuevo estado y el contador actualizado. */
    public LikeResult toggleLike(ContentType type, UUID contentId, UUID visitorId) {
        // Sin leer antes de escribir: con un doble toque las dos peticiones veían
        // "sin me gusta" y la segunda chocaba con la restricción única (500).
        boolean liked = contentLikeRepository.deleteLike(type, contentId, visitorId) == 0;
        if (liked) {
            contentLikeRepository.insertLikeIfAbsent(type.name(), contentId, visitorId);
        }
        return new LikeResult(liked, contentLikeRepository.countByContentTypeAndContentId(type, contentId));
    }

    public record LikeResult(boolean liked, long likeCount) {
    }
}
