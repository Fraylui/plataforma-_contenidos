package pe.plataformacontenidos.geography;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GeographicUnitRepository extends JpaRepository<GeographicUnit, UUID> {

    boolean existsBySlug(String slug);

    List<GeographicUnit> findByActiveTrueAndLevel(GeographyLevel level);

    List<GeographicUnit> findByActiveTrueAndParentId(UUID parentId);

    List<GeographicUnit> findByActiveTrueAndLevelAndParentIdIsNull(GeographyLevel level);

    long countByParentId(UUID parentId);
}
