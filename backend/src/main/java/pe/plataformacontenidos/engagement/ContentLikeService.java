package pe.plataformacontenidos.engagement;

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

    /** Alterna el "me gusta" de un lector anónimo. Devuelve el nuevo estado y el contador actualizado. */
    public LikeResult toggleLike(ContentType type, UUID contentId, UUID visitorId) {
        var existing = contentLikeRepository.findByContentTypeAndContentIdAndVisitorId(type, contentId, visitorId);
        if (existing.isPresent()) {
            contentLikeRepository.delete(existing.get());
        } else {
            contentLikeRepository.save(new ContentLike(type, contentId, visitorId));
        }
        return new LikeResult(existing.isEmpty(), contentLikeRepository.countByContentTypeAndContentId(type, contentId));
    }

    public record LikeResult(boolean liked, long likeCount) {
    }
}
