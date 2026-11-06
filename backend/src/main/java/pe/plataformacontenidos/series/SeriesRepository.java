package pe.plataformacontenidos.series;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import pe.plataformacontenidos.shared.publishing.PublicationStatus;

public interface SeriesRepository extends JpaRepository<Series, UUID>, JpaSpecificationExecutor<Series> {

    Optional<Series> findBySlugAndStatus(String slug, PublicationStatus status);

    Page<Series> findByStatus(PublicationStatus status, Pageable pageable);

    /** Las que se sincronizan: publicadas o en borrador (archivadas no). */
    List<Series> findByStatusIn(List<PublicationStatus> statuses);

    boolean existsBySlug(String slug);

    boolean existsByYoutubePlaylistId(String youtubePlaylistId);
}
