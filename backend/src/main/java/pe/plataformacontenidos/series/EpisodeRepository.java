package pe.plataformacontenidos.series;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EpisodeRepository extends JpaRepository<Episode, UUID> {

    Page<Episode> findBySeriesIdOrderByPublishedAtDesc(UUID seriesId, Pageable pageable);

    Page<Episode> findBySeriesIdAndStatusOrderByPublishedAtDesc(UUID seriesId, Episode.Status status, Pageable pageable);

    Optional<Episode> findBySeriesIdAndSlugAndStatus(UUID seriesId, String slug, Episode.Status status);

    boolean existsBySeriesIdAndSlug(UUID seriesId, String slug);

    @Query("select e.youtubeVideoId from Episode e where e.seriesId = :seriesId and e.youtubeVideoId in :videoIds")
    Set<String> findExistingVideoIds(@Param("seriesId") UUID seriesId, @Param("videoIds") Collection<String> videoIds);

    /** Episodios publicados por serie, para las portadas del listado (una consulta por página). */
    @Query("select e.seriesId, count(e) from Episode e where e.status = 'PUBLISHED' and e.seriesId in :ids group by e.seriesId")
    List<Object[]> countPublishedBySeries(@Param("ids") Collection<UUID> ids);

    /** Episodio publicado más reciente de cada serie pedida (portada y "último episodio"). */
    @Query("""
            select e from Episode e where e.status = 'PUBLISHED' and e.seriesId in :ids
               and e.publishedAt = (select max(x.publishedAt) from Episode x
                                     where x.seriesId = e.seriesId and x.status = 'PUBLISHED')""")
    List<Episode> findLatestPublished(@Param("ids") Collection<UUID> ids);

    /** Siguiente episodio (más nuevo) y anterior (más viejo) de uno dado. */
    Optional<Episode> findFirstBySeriesIdAndStatusAndPublishedAtGreaterThanOrderByPublishedAtAsc(UUID seriesId,
            Episode.Status status, java.time.Instant publishedAt);

    Optional<Episode> findFirstBySeriesIdAndStatusAndPublishedAtLessThanOrderByPublishedAtDesc(UUID seriesId,
            Episode.Status status, java.time.Instant publishedAt);
}
