package pe.plataformacontenidos.places;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaceRepository extends JpaRepository<Place, UUID> {

    Optional<Place> findBySlugAndStatus(String slug, PlaceStatus status);

    boolean existsBySlug(String slug);

    Page<Place> findByStatus(PlaceStatus status, Pageable pageable);

    Page<Place> findByStatusAndCategoryId(PlaceStatus status, UUID categoryId, Pageable pageable);

    Page<Place> findByStatusAndGeographyId(PlaceStatus status, UUID geographyId, Pageable pageable);

    Page<Place> findByStatusAndCategoryIdAndGeographyId(
            PlaceStatus status, UUID categoryId, UUID geographyId, Pageable pageable);

    List<Place> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);

    List<Place> findByStatusAndScheduledAtBefore(PlaceStatus status, Instant threshold);

    long countByStatus(PlaceStatus status);
}
