package pe.plataformacontenidos.stories;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

interface StoryRepository extends JpaRepository<Story, UUID> {

    /** Las que se ven ahora (sin caducar o Destacadas), de la más vieja a la más nueva. */
    @Query("select s from Story s where s.expiresAt > :now or s.highlighted = true order by s.publishedAt asc")
    List<Story> findVisible(Instant now);

    /** Sin caducar (las Destacadas caducadas viven en la página del tema, no en la fila del Inicio). */
    List<Story> findByExpiresAtAfterOrderByPublishedAtAsc(Instant now);

    List<Story> findByCategoryIdAndHighlightedTrueOrderByPublishedAtDesc(UUID categoryId);

    List<Story> findByHighlightedTrueOrderByPublishedAtDesc();

    /** Terminadas sin destacar, desde {@code since}: la pestaña «Terminadas (7 días)» del panel. */
    List<Story> findByHighlightedFalseAndExpiresAtBetweenOrderByExpiresAtDesc(Instant since, Instant now);

    List<Story> findByHighlightedFalseAndExpiresAtBefore(Instant cutoff);

    @Modifying
    @Query(value = "UPDATE stories.stories SET cta_clicks = cta_clicks + 1 WHERE id = :id", nativeQuery = true)
    int incrementCtaClicks(UUID id);
}
