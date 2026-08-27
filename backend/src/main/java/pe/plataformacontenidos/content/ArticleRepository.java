package pe.plataformacontenidos.content;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ArticleRepository extends JpaRepository<Article, UUID> {

    Optional<Article> findBySlugAndStatus(String slug, ArticleStatus status);

    boolean existsBySlug(String slug);

    Page<Article> findByStatus(ArticleStatus status, Pageable pageable);

    Page<Article> findByStatusAndCategoryId(ArticleStatus status, UUID categoryId, Pageable pageable);

    Page<Article> findByStatusAndGeographyId(ArticleStatus status, UUID geographyId, Pageable pageable);

    Page<Article> findByStatusAndCategoryIdAndGeographyId(
            ArticleStatus status, UUID categoryId, UUID geographyId, Pageable pageable);

    List<Article> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);

    List<Article> findByStatusAndScheduledAtBefore(ArticleStatus status, Instant threshold);

    long countByStatus(ArticleStatus status);

    long countByStatusAndPublishedAtAfter(ArticleStatus status, Instant threshold);

    /**
     * Búsqueda de texto completo (CONTEXTO.md sección 16) sobre artículos
     * publicados, vía la columna generada search_vector (V12__article_search.sql).
     * websearch_to_tsquery interpreta la sintaxis "estilo Google" (frases con
     * comillas, "-" para excluir) y sanea el input — no hay riesgo de
     * inyección, va como bind param. Sin Pageable.getSort(): el orden lo
     * gobierna ts_rank, no un ORDER BY genérico de Spring Data.
     */
    @Query(value = """
            SELECT a.* FROM content.articles a
            WHERE a.status = 'PUBLISHED' AND a.search_vector @@ websearch_to_tsquery('spanish', :query)
            ORDER BY ts_rank(a.search_vector, websearch_to_tsquery('spanish', :query)) DESC
            """,
            countQuery = """
            SELECT count(*) FROM content.articles a
            WHERE a.status = 'PUBLISHED' AND a.search_vector @@ websearch_to_tsquery('spanish', :query)
            """,
            nativeQuery = true)
    Page<Article> search(@Param("query") String query, Pageable pageable);
}
