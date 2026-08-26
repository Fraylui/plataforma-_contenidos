package pe.plataformacontenidos.content;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArticleRepository extends JpaRepository<Article, UUID> {

    Optional<Article> findBySlugAndStatus(String slug, ArticleStatus status);

    boolean existsBySlug(String slug);

    Page<Article> findByStatus(ArticleStatus status, Pageable pageable);

    Page<Article> findByStatusAndCategoryId(ArticleStatus status, UUID categoryId, Pageable pageable);

    List<Article> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);

    List<Article> findByStatusAndScheduledAtBefore(ArticleStatus status, Instant threshold);
}
