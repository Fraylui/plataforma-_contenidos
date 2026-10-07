package pe.plataformacontenidos.content;

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

public interface ArticleRepository extends JpaRepository<Article, UUID> {

    Optional<Article> findBySlugAndStatus(String slug, PublicationStatus status);

    boolean existsBySlug(String slug);

    Page<Article> findByStatus(PublicationStatus status, Pageable pageable);

    Page<Article> findByStatusAndCategoryId(PublicationStatus status, UUID categoryId, Pageable pageable);

    List<Article> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);

    List<Article> findByStatusAndScheduledAtBefore(PublicationStatus status, Instant threshold);

    long countByStatus(PublicationStatus status);

    long countByStatusAndPublishedAtAfter(PublicationStatus status, Instant threshold);

    /** Ver StatsService — un punto por día con publicaciones, para el gráfico de tendencia de Estadísticas. Los días sin publicaciones no aparecen; StatsService completa los huecos con 0. */
    @Query(value = """
            SELECT date_trunc('day', published_at) AS day, count(*) AS cnt
            FROM content.articles
            WHERE status = 'PUBLISHED' AND published_at >= :threshold
            GROUP BY day
            ORDER BY day
            """, nativeQuery = true)
    List<DailyCountRow> countPublishedByDaySince(@Param("threshold") Instant threshold);

    /** El driver devuelve Instant para timestamptz, no java.sql.Timestamp — con ese tipo la proyección fallaba con "Cannot project java.time.Instant to java.sql.Timestamp" en cada request. */
    interface DailyCountRow {
        Instant getDay();
        Long getCnt();
    }


    /**
     * Búsqueda de texto completo (CONTEXTO.md sección 16) sobre artículos
     * publicados, vía la columna generada search_vector (V12__article_search.sql,
     * normalizada sin acentos en V36__search_unaccent.sql). websearch_to_tsquery
     * interpreta la sintaxis "estilo Google" (frases con comillas, "-" para
     * excluir) y sanea el input — no hay riesgo de inyección, va como bind
     * param. immutable_unaccent envuelve tanto la columna indexada como la
     * consulta, para que "peru" encuentre "Perú" en cualquier dirección.
     * categoryId opcional vía "param IS NULL OR" (mismo patrón que
     * EventRepository.findUpcoming). Sin Pageable.getSort(): el orden lo
     * gobierna ts_rank, no un ORDER BY genérico de Spring Data.
     */
    @Query(value = """
            SELECT a.* FROM content.articles a
            WHERE a.status = 'PUBLISHED'
            AND a.search_vector @@ websearch_to_tsquery('spanish', public.immutable_unaccent(:query))
            AND (:categoryId IS NULL OR a.category_id = :categoryId)
            ORDER BY ts_rank(a.search_vector, websearch_to_tsquery('spanish', public.immutable_unaccent(:query))) DESC
            """,
            countQuery = """
            SELECT count(*) FROM content.articles a
            WHERE a.status = 'PUBLISHED'
            AND a.search_vector @@ websearch_to_tsquery('spanish', public.immutable_unaccent(:query))
            AND (:categoryId IS NULL OR a.category_id = :categoryId)
            """,
            nativeQuery = true)
    Page<Article> search(@Param("query") String query, @Param("categoryId") UUID categoryId, Pageable pageable);
}
