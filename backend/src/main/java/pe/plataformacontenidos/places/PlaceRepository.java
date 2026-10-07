package pe.plataformacontenidos.places;

import pe.plataformacontenidos.shared.publishing.PublicationStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlaceRepository extends JpaRepository<Place, UUID> {

    Optional<Place> findBySlugAndStatus(String slug, PublicationStatus status);

    boolean existsBySlug(String slug);

    Page<Place> findByStatus(PublicationStatus status, Pageable pageable);

    Page<Place> findByStatusAndCategoryId(PublicationStatus status, UUID categoryId, Pageable pageable);

    List<Place> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);

    List<Place> findByStatusAndScheduledAtBefore(PublicationStatus status, Instant threshold);

    long countByStatus(PublicationStatus status);

    /**
     * Búsqueda de texto completo (CONTEXTO.md sección 16) sobre lugares
     * publicados — mismo patrón que ArticleRepository.search
     * (V15__place_search.sql, unaccent en V36__search_unaccent.sql).
     */
    @Query(value = """
            SELECT p.* FROM places.places p
            WHERE p.status = 'PUBLISHED'
            AND p.search_vector @@ websearch_to_tsquery('spanish', public.immutable_unaccent(:query))
            AND (:categoryId IS NULL OR p.category_id = :categoryId)
            ORDER BY ts_rank(p.search_vector, websearch_to_tsquery('spanish', public.immutable_unaccent(:query))) DESC
            """,
            countQuery = """
            SELECT count(*) FROM places.places p
            WHERE p.status = 'PUBLISHED'
            AND p.search_vector @@ websearch_to_tsquery('spanish', public.immutable_unaccent(:query))
            AND (:categoryId IS NULL OR p.category_id = :categoryId)
            """,
            nativeQuery = true)
    Page<Place> search(@Param("query") String query, @Param("categoryId") UUID categoryId, Pageable pageable);
}
