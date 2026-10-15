package pe.plataformacontenidos.live;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LiveStreamRepository extends JpaRepository<LiveStream, UUID> {

    /** La que está en vivo ahora (la más reciente si hubiera más de una). */
    Optional<LiveStream> findFirstByStatusOrderByStartedAtDesc(LiveStream.Status status);

    /** Próximas: programadas, con o sin hora, las más cercanas primero. */
    List<LiveStream> findTop10ByStatusOrderByScheduledStartAscCreatedAtDesc(LiveStream.Status status);

    Optional<LiveStream> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<LiveStream> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /** En vivo desde antes de {@code before}: la tarea de seguridad las termina. */
    List<LiveStream> findByStatusAndStartedAtBefore(LiveStream.Status status, Instant before);
}
