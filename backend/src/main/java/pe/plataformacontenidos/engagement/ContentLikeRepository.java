package pe.plataformacontenidos.engagement;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContentLikeRepository extends JpaRepository<ContentLike, UUID> {

    long countByContentTypeAndContentId(ContentType contentType, UUID contentId);

    Optional<ContentLike> findByContentTypeAndContentIdAndVisitorId(ContentType contentType, UUID contentId, UUID visitorId);
}
