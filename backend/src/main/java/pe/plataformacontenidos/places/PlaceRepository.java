package pe.plataformacontenidos.places;

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

    Optional<Place> findBySlugAndStatus(String slug, PlaceStatus status);

    boolean existsBySlug(String slug);

    Page<Place> findByStatus(PlaceStatus status, Pageable pageable);

    Page<Place> findByStatusAndCategoryId(PlaceStatus status, UUID categoryId, Pageable pageable);

    Page<Place> findByStatusAndGeographyId(PlaceStatus status, UUID geographyId, Pageable pageable);

    Page<Place> findByStatusAndCategoryIdAndGeographyId(
            PlaceStatus status, UUID categoryId, UUID geographyId, Pageable pageable);

    List<Place> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);

    List<Place> findByStatusAndScheduledAtBefore(PlaceStatus status, Instant threshold);

    long countByStatus(PlaceStatus status);

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
            AND (:geographyId IS NULL OR p.geography_id = :geographyId)
            ORDER BY ts_rank(p.search_vector, websearch_to_tsquery('spanish', public.immutable_unaccent(:query))) DESC
            """,
            countQuery = """
            SELECT count(*) FROM places.places p
            WHERE p.status = 'PUBLISHED'
            AND p.search_vector @@ websearch_to_tsquery('spanish', public.immutable_unaccent(:query))
            AND (:categoryId IS NULL OR p.category_id = :categoryId)
            AND (:geographyId IS NULL OR p.geography_id = :geographyId)
            """,
            nativeQuery = true)
    Page<Place> search(@Param("query") String query, @Param("categoryId") UUID categoryId,
            @Param("geographyId") UUID geographyId, Pageable pageable);
}
