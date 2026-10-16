package pe.plataformacontenidos.events;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
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

public interface EventRepository extends JpaRepository<Event, UUID>, JpaSpecificationExecutor<Event> {

    Optional<Event> findBySlugAndStatus(String slug, PublicationStatus status);

    boolean existsBySlug(String slug);


    List<Event> findByStatusAndScheduledAtBefore(PublicationStatus status, Instant threshold);

    long countByStatus(PublicationStatus status);

    /**
     * Eventos próximos (starts_at >= now), del más cercano al más lejano —
     * la razón de ser de este módulo frente a Publication/Place, que ordenan por
     * published_at (CONTEXTO.md: separar activamente lo vigente de lo pasado
     * en vez de un muro cronológico único). categoryId opcional vía
     * "param IS NULL OR".
     */
    @Query("""
            SELECT e FROM Event e WHERE e.status = :status AND e.nextOccurrence >= :now
            AND (:categoryId IS NULL OR e.categoryId = :categoryId)
            ORDER BY e.nextOccurrence ASC
            """)
    Page<Event> findUpcoming(@Param("status") PublicationStatus status, @Param("now") Instant now,
            @Param("categoryId") UUID categoryId, Pageable pageable);

    /** Fechas únicas ya pasadas, de la más reciente a la más antigua (las anuales siempre vuelven). */
    @Query("""
            SELECT e FROM Event e WHERE e.status = :status AND e.recursYearly = false AND e.nextOccurrence < :now
            AND (:categoryId IS NULL OR e.categoryId = :categoryId)
            ORDER BY e.nextOccurrence DESC
            """)
    Page<Event> findPast(@Param("status") PublicationStatus status, @Param("now") Instant now,
            @Param("categoryId") UUID categoryId, Pageable pageable);

    /** «Hoy se celebra»: las que tocan en [from, to). */
    @Query("""
            SELECT e FROM Event e WHERE e.status = :status AND e.nextOccurrence >= :from AND e.nextOccurrence < :to
            ORDER BY e.nextOccurrence ASC, e.title ASC
            """)
    List<Event> findOccurringBetween(@Param("status") PublicationStatus status, @Param("from") Instant from,
            @Param("to") Instant to);

    /** Fechas anuales cuyo día ya pasó: la tarea diaria las mueve al año siguiente. */
    List<Event> findByRecursYearlyTrueAndNextOccurrenceBefore(Instant threshold);

    /**
     * Búsqueda de texto completo (CONTEXTO.md sección 16) sobre eventos
     * publicados — mismo patrón que PlaceRepository.search
     * (V17__event_search.sql, unaccent en V36__search_unaccent.sql). from/to
     * filtran por starts_at (rango de fechas del buscador) — únicos entre
     * los 6 search() porque solo Evento tiene una fecha propia con sentido
     * de filtro (los demás usan publishedAt, que ya ordena el listado, no
     * es algo que quien busca elija).
     */
    @Query(value = """
            SELECT e.* FROM events.events e
            WHERE e.status = 'PUBLISHED'
            AND e.search_vector @@ websearch_to_tsquery('spanish', public.immutable_unaccent(:query))
            AND (:categoryId IS NULL OR e.category_id = :categoryId)
            AND (CAST(:from AS timestamptz) IS NULL OR e.next_occurrence >= :from)
            AND (CAST(:to AS timestamptz) IS NULL OR e.next_occurrence <= :to)
            ORDER BY ts_rank(e.search_vector, websearch_to_tsquery('spanish', public.immutable_unaccent(:query))) DESC
            """,
            countQuery = """
            SELECT count(*) FROM events.events e
            WHERE e.status = 'PUBLISHED'
            AND e.search_vector @@ websearch_to_tsquery('spanish', public.immutable_unaccent(:query))
            AND (:categoryId IS NULL OR e.category_id = :categoryId)
            AND (CAST(:from AS timestamptz) IS NULL OR e.next_occurrence >= :from)
            AND (CAST(:to AS timestamptz) IS NULL OR e.next_occurrence <= :to)
            """,
            nativeQuery = true)
    Page<Event> search(@Param("query") String query, @Param("categoryId") UUID categoryId,
            @Param("from") Instant from, @Param("to") Instant to, Pageable pageable);
}
