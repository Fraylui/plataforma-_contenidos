package pe.plataformacontenidos.galleries;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GalleryRepository extends JpaRepository<Gallery, UUID> {

    Optional<Gallery> findBySlugAndStatus(String slug, GalleryStatus status);

    boolean existsBySlug(String slug);

    Page<Gallery> findByStatus(GalleryStatus status, Pageable pageable);

    Page<Gallery> findByStatusAndCategoryId(GalleryStatus status, UUID categoryId, Pageable pageable);

    Page<Gallery> findByStatusAndGeographyId(GalleryStatus status, UUID geographyId, Pageable pageable);

    Page<Gallery> findByStatusAndCategoryIdAndGeographyId(
            GalleryStatus status, UUID categoryId, UUID geographyId, Pageable pageable);

    List<Gallery> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);

    List<Gallery> findByStatusAndScheduledAtBefore(GalleryStatus status, Instant threshold);

    long countByStatus(GalleryStatus status);

    /**
     * Búsqueda de texto completo (CONTEXTO.md sección 16) sobre galerías
     * publicadas — mismo patrón que PlaceRepository/EventRepository.search
     * (V19__gallery_search.sql). Solo title+excerpt: no hay body que indexar.
     */
    @Query(value = """
            SELECT g.* FROM galleries.galleries g
            WHERE g.status = 'PUBLISHED' AND g.search_vector @@ websearch_to_tsquery('spanish', :query)
            ORDER BY ts_rank(g.search_vector, websearch_to_tsquery('spanish', :query)) DESC
            """,
            countQuery = """
            SELECT count(*) FROM galleries.galleries g
            WHERE g.status = 'PUBLISHED' AND g.search_vector @@ websearch_to_tsquery('spanish', :query)
            """,
            nativeQuery = true)
    Page<Gallery> search(@Param("query") String query, Pageable pageable);
}
