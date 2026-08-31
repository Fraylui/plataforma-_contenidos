package pe.plataformacontenidos.content;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArticleLikeRepository extends JpaRepository<ArticleLike, UUID> {

    long countByArticleId(UUID articleId);

    Optional<ArticleLike> findByArticleIdAndVisitorId(UUID articleId, UUID visitorId);
}
