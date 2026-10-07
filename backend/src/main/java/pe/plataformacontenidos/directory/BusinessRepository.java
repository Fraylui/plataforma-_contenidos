package pe.plataformacontenidos.directory;

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

public interface BusinessRepository extends JpaRepository<Business, UUID> {

    Optional<Business> findBySlugAndStatus(String slug, PublicationStatus status);

    boolean existsBySlug(String slug);

    Page<Business> findByStatus(PublicationStatus status, Pageable pageable);

    Page<Business> findByStatusAndCategoryId(PublicationStatus status, UUID categoryId, Pageable pageable);

    Page<Business> findByStatusAndBusinessType(PublicationStatus status, BusinessType businessType, Pageable pageable);

    List<Business> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);

    List<Business> findByStatusAndScheduledAtBefore(PublicationStatus status, Instant threshold);

    long countByStatus(PublicationStatus status);

    /**
     * Búsqueda de texto completo (CONTEXTO.md sección 16) sobre fichas de
     * directorio publicadas — mismo patrón que ReviewRepository.search
     * (V24__directory_search.sql, unaccent en V36__search_unaccent.sql).
     */
    @Query(value = """
            SELECT b.* FROM directory.businesses b
            WHERE b.status = 'PUBLISHED'
            AND b.search_vector @@ websearch_to_tsquery('spanish', public.immutable_unaccent(:query))
            AND (:categoryId IS NULL OR b.category_id = :categoryId)
            ORDER BY ts_rank(b.search_vector, websearch_to_tsquery('spanish', public.immutable_unaccent(:query))) DESC
            """,
            countQuery = """
            SELECT count(*) FROM directory.businesses b
            WHERE b.status = 'PUBLISHED'
            AND b.search_vector @@ websearch_to_tsquery('spanish', public.immutable_unaccent(:query))
            AND (:categoryId IS NULL OR b.category_id = :categoryId)
            """,
            nativeQuery = true)
    Page<Business> search(@Param("query") String query, @Param("categoryId") UUID categoryId, Pageable pageable);
}
