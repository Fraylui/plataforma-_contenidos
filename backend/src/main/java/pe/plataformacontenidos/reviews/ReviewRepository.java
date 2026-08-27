package pe.plataformacontenidos.reviews;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

    Optional<Review> findBySlugAndStatus(String slug, ReviewStatus status);

    boolean existsBySlug(String slug);

    Page<Review> findByStatus(ReviewStatus status, Pageable pageable);

    Page<Review> findByStatusAndCategoryId(ReviewStatus status, UUID categoryId, Pageable pageable);

    Page<Review> findByStatusAndGeographyId(ReviewStatus status, UUID geographyId, Pageable pageable);

    Page<Review> findByStatusAndCategoryIdAndGeographyId(
            ReviewStatus status, UUID categoryId, UUID geographyId, Pageable pageable);

    List<Review> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);

    List<Review> findByStatusAndScheduledAtBefore(ReviewStatus status, Instant threshold);

    long countByStatus(ReviewStatus status);

    /**
     * Búsqueda de texto completo (CONTEXTO.md sección 16) sobre reseñas
     * publicadas — mismo patrón que PlaceRepository/EventRepository.search
     * (V21__review_search.sql).
     */
    @Query(value = """
            SELECT r.* FROM reviews.reviews r
            WHERE r.status = 'PUBLISHED' AND r.search_vector @@ websearch_to_tsquery('spanish', :query)
            ORDER BY ts_rank(r.search_vector, websearch_to_tsquery('spanish', :query)) DESC
            """,
            countQuery = """
            SELECT count(*) FROM reviews.reviews r
            WHERE r.status = 'PUBLISHED' AND r.search_vector @@ websearch_to_tsquery('spanish', :query)
            """,
            nativeQuery = true)
    Page<Review> search(@Param("query") String query, Pageable pageable);
}
