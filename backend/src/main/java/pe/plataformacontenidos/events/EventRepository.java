package pe.plataformacontenidos.events;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EventRepository extends JpaRepository<Event, UUID> {

    Optional<Event> findBySlugAndStatus(String slug, EventStatus status);

    boolean existsBySlug(String slug);

    List<Event> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);

    List<Event> findByStatusAndScheduledAtBefore(EventStatus status, Instant threshold);

    long countByStatus(EventStatus status);

    /**
     * Eventos próximos (starts_at >= now), del más cercano al más lejano —
     * la razón de ser de este módulo frente a Article/Place, que ordenan por
     * published_at (CONTEXTO.md: separar activamente lo vigente de lo pasado
     * en vez de un muro cronológico único). categoryId/geographyId
     * opcionales vía "param IS NULL OR" en una sola query, en vez de repetir
     * el patrón combinatorio de 4 métodos que usa PlaceRepository.
     */
    @Query("""
            SELECT e FROM Event e WHERE e.status = :status AND e.startsAt >= :now
            AND (:categoryId IS NULL OR e.categoryId = :categoryId)
            AND (:geographyId IS NULL OR e.geographyId = :geographyId)
            ORDER BY e.startsAt ASC
            """)
    Page<Event> findUpcoming(@Param("status") EventStatus status, @Param("now") Instant now,
            @Param("categoryId") UUID categoryId, @Param("geographyId") UUID geographyId, Pageable pageable);

    /** Eventos pasados (starts_at < now), del más reciente al más antiguo. */
    @Query("""
            SELECT e FROM Event e WHERE e.status = :status AND e.startsAt < :now
            AND (:categoryId IS NULL OR e.categoryId = :categoryId)
            AND (:geographyId IS NULL OR e.geographyId = :geographyId)
            ORDER BY e.startsAt DESC
            """)
    Page<Event> findPast(@Param("status") EventStatus status, @Param("now") Instant now,
            @Param("categoryId") UUID categoryId, @Param("geographyId") UUID geographyId, Pageable pageable);

    /**
     * Búsqueda de texto completo (CONTEXTO.md sección 16) sobre eventos
     * publicados — mismo patrón que PlaceRepository.search
     * (V17__event_search.sql).
     */
    @Query(value = """
            SELECT e.* FROM events.events e
            WHERE e.status = 'PUBLISHED' AND e.search_vector @@ websearch_to_tsquery('spanish', :query)
            ORDER BY ts_rank(e.search_vector, websearch_to_tsquery('spanish', :query)) DESC
            """,
            countQuery = """
            SELECT count(*) FROM events.events e
            WHERE e.status = 'PUBLISHED' AND e.search_vector @@ websearch_to_tsquery('spanish', :query)
            """,
            nativeQuery = true)
    Page<Event> search(@Param("query") String query, Pageable pageable);
}
