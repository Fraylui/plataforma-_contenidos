package pe.plataformacontenidos.advertising;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdPlacementRepository extends JpaRepository<AdPlacement, UUID> {

    Optional<AdPlacement> findByKey(String key);

    boolean existsByKey(String key);

    boolean existsByKeyAndIdNot(String key, UUID id);

    List<AdPlacement> findByEnabledTrue();
}
